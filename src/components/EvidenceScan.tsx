"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Loader2, ScanText } from "lucide-react";
import { detectStepsFromImage, type StepDetection } from "@/lib/stepOcr";

type ScanStatus = "idle" | "scanning" | "done" | "failed";

/** OCRs an uploaded evidence photo and fills the step field if the user hasn't typed a number yet. */
export function useEvidenceScan(setStepCount: Dispatch<SetStateAction<number>>) {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [detected, setDetected] = useState<StepDetection | null>(null);
  // Bumped on every new photo / reset so a slow scan of an older photo is ignored
  const scanIdRef = useRef(0);

  const reset = () => {
    scanIdRef.current++;
    setStatus("idle");
    setDetected(null);
  };

  const scan = async (dataUrl: string) => {
    const scanId = ++scanIdRef.current;
    setStatus("scanning");
    setDetected(null);
    try {
      const result = await detectStepsFromImage(dataUrl);
      if (scanId !== scanIdRef.current) return;
      setDetected(result);
      setStatus(result ? "done" : "failed");
      // Only auto-fill an empty field; never overwrite a number the user typed
      if (result) setStepCount((prev) => (prev === 0 ? result.steps : prev));
    } catch (err) {
      console.error("Step OCR failed:", err);
      if (scanId === scanIdRef.current) setStatus("failed");
    }
  };

  return { status, detected, scan, reset };
}

interface EvidenceScanStatusProps {
  status: ScanStatus;
  detected: StepDetection | null;
  stepCount: number;
  onUse: (steps: number) => void;
}

export function EvidenceScanStatus({ status, detected, stepCount, onUse }: EvidenceScanStatusProps) {
  if (status === "scanning") {
    return (
      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading step count from photo...
      </p>
    );
  }
  if (status === "failed") {
    return (
      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <ScanText className="w-3.5 h-3.5" /> Couldn&apos;t read the step count. Please enter it manually.
      </p>
    );
  }
  if (status !== "done" || !detected) return null;

  if (stepCount === detected.steps) {
    return (
      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
        <ScanText className="w-3.5 h-3.5 shrink-0" />
        {detected.confidence === "high"
          ? "Step count filled from photo. Please double-check it."
          : "Best guess from photo. Please make sure it matches."}
      </p>
    );
  }

  return (
    <div className="text-[11px] flex items-center justify-between gap-2">
      <p className="text-slate-300 flex items-center gap-1.5">
        <ScanText className="w-3.5 h-3.5 shrink-0 text-red-400" />
        Photo shows {detected.steps.toLocaleString("en-US")} steps
      </p>
      <button
        type="button"
        onClick={() => onUse(detected.steps)}
        className="px-2.5 py-1 font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
      >
        Use this
      </button>
    </div>
  );
}
