// Reads the step count off a pedometer / health-app screenshot, entirely in the browser.
// Tesseract (~4MB wasm + language data) is only downloaded the first time a photo is scanned.

import type { Worker } from "tesseract.js";

export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrLine {
  words: OcrWord[];
}

export interface StepDetection {
  steps: number;
  /** "high" when the number is tied to a "steps"/"langkah" label, "low" when it is a best guess */
  confidence: "high" | "low";
}

const STEP_WORD_RE = /^(steps?|langkah|pasos|schritte|歩数?)$/i;
// Units that mean a number is *not* the step count ("264 kcal", "13 hours", "9.1m")
const OTHER_UNIT_RE =
  /^(km|mi|m|kcal|cal|kal|kalori|calories|kj|min|mins?|minutes?|mnt|menit|detik|jam|h|hrs?|hours?|bpm|floors?|lantai|kg|lbs?|%)$/i;
const DATE_RE = /\b(jan|feb|mar|apr|may|mei|jun|jul|aug|agu|agt|sep|oct|okt|nov|dec|des)[a-z]*\b|\d{1,2}[/-]\d{1,2}[/-]/i;
// "8,432" / "8.432" / "8 432" or a plain run of digits, not part of a time, decimal or percentage
const NUMBER_RE = /(\/\s*)?(?<![\d.,:])(\d{1,3}(?:[.,  ]\d{3})+|\d{2,6})(?![\d:%]|[.,]\d)/g;
// A goal right after the number: "264/630", "8,432 / 10,000"
const GOAL_SUFFIX_RE = /^\s*\/\s*[\d.,]+/;

const MIN_STEPS = 10;
const MAX_STEPS = 100_000;

const clean = (w: string) => w.replace(/^[^\p{L}\p{N}%]+|[^\p{L}\p{N}%]+$/gu, "");
const isStepWord = (w: string | undefined) => !!w && STEP_WORD_RE.test(clean(w));
const isOtherUnit = (w: string | undefined) => !!w && OTHER_UNIT_RE.test(clean(w));

interface Candidate {
  steps: number;
  height: number;
  score: number;
  labelled: boolean;
}

/** Pick the most likely step count from OCR'd lines. Exported separately so it can be unit-tested. */
export function pickStepCount(lines: OcrLine[]): StepDetection | null {
  const candidates: Candidate[] = [];

  lines.forEach((line, i) => {
    const text = line.words.map((w) => w.text).join(" ");
    // Character offset where each word starts in `text`, to map regex matches back to boxes
    const starts: number[] = [];
    line.words.reduce((pos, w) => (starts.push(pos), pos + w.text.length + 1), 0);

    for (const match of text.matchAll(NUMBER_RE)) {
      const steps = parseInt(match[2].replace(/\D/g, ""), 10);
      if (!(steps >= MIN_STEPS && steps <= MAX_STEPS)) continue;

      const numStart = match.index! + (match[1]?.length ?? 0);
      const numEnd = match.index! + match[0].length;
      const numWords = line.words.filter(
        (w, k) => starts[k] < numEnd && starts[k] + w.text.length > numStart
      );
      const box = {
        x0: Math.min(...numWords.map((w) => w.x0)),
        x1: Math.max(...numWords.map((w) => w.x1)),
      };
      const height = Math.max(...numWords.map((w) => w.y1 - w.y0));

      const after = text.slice(numEnd).replace(GOAL_SUFFIX_RE, "");
      const nextWord = after.match(/^\s*([^\s\d]+)/)?.[1];
      const prevWord = match[1] ? undefined : text.slice(0, numStart).trim().split(/\s+/).pop();

      let score = 0;
      let labelled = false;
      if (isStepWord(nextWord)) {
        score += 6; // "8,007 steps"
        labelled = true;
      } else if (isOtherUnit(nextWord)) {
        score -= 6; // "264/630 kcal", "13 hours"
      } else if (isStepWord(prevWord)) {
        score += 4; // "Steps 8,007"
        labelled = true;
      } else {
        // A "Steps" label stacked above/below the number, in the same column
        const neighbours = [lines[i - 1], lines[i + 1]].filter(Boolean).flatMap((l) => l.words);
        const stepLabels = neighbours.filter((w) => isStepWord(w.text));
        if (stepLabels.some((w) => w.x0 < box.x1 && w.x1 > box.x0)) {
          score += 4;
          labelled = true;
        } else if (stepLabels.length > 0) {
          score += 1;
        }
      }
      if (match[1]) {
        score -= 4; // "/ 8000" is the daily goal, not today's count
        labelled = false;
      }
      if (DATE_RE.test(text)) score -= 2;
      if (steps < 100) score -= 2;

      candidates.push({ steps, height, score, labelled });
    }
  });

  if (candidates.length === 0) return null;

  // Step counts are often the biggest number on screen — size breaks ties between unlabelled numbers
  const maxHeight = Math.max(1, ...candidates.map((c) => c.height));
  const best = candidates.reduce((a, b) =>
    b.score + (b.height / maxHeight) * 3 > a.score + (a.height / maxHeight) * 3 ? b : a
  );
  if (best.score + (best.height / maxHeight) * 3 <= 0) return null;
  return { steps: best.steps, confidence: best.labelled ? "high" : "low" };
}

let workerPromise: Promise<Worker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = import("tesseract.js")
      .then(({ createWorker }) => createWorker("eng"))
      .catch((err) => {
        workerPromise = null; // allow a retry, e.g. after a network hiccup
        throw err;
      });
  }
  return workerPromise;
}

/** Grayscale + invert dark-mode screenshots (Tesseract reads dark text on light best). */
async function preprocess(dataUrl: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = grey;
    total += grey;
  }
  if (total / (d.length / 4) < 128) {
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = 255 - d[i];
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

export async function detectStepsFromImage(dataUrl: string): Promise<StepDetection | null> {
  const [worker, canvas] = await Promise.all([getWorker(), preprocess(dataUrl)]);
  const { data } = await worker.recognize(canvas, {}, { blocks: true });

  const lines: OcrLine[] = (data.blocks ?? []).flatMap((b) =>
    b.paragraphs.flatMap((p) =>
      p.lines.map((l) => ({ words: l.words.map((w) => ({ text: w.text, ...w.bbox })) }))
    )
  );
  return pickStepCount(lines);
}
