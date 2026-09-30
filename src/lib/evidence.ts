import { prisma } from "./prisma";
import type { SessionUser } from "./auth";

// Evidence photos are stored as Base64 data URLs (often 100KB+ each). List APIs never ship
// them inline — they return a lightweight link to /api/steps/[id]/evidence instead, which
// streams the image and lets the browser cache it.

const EVIDENCE_LINK_RE = /^\/api\/steps\/([^/?#]+)\/evidence(?:[?#].*)?$/;

export function evidenceLink(id: string, updatedAt: Date) {
  // ?v= busts the browser cache when the photo is replaced
  return `/api/steps/${id}/evidence?v=${updatedAt.getTime()}`;
}

/** Replace inline evidence with links. Logs must be loaded with `omit: { evidenceUrl: true }`. */
export async function attachEvidenceLinks<T extends { id: string; updatedAt: Date }>(
  logs: T[]
): Promise<(T & { evidenceUrl: string | null })[]> {
  if (logs.length === 0) return [];
  const withEvidence = await prisma.stepLog.findMany({
    where: { id: { in: logs.map((l) => l.id) }, evidenceUrl: { not: null } },
    select: { id: true },
  });
  const ids = new Set(withEvidence.map((l) => l.id));
  return logs.map((l) => ({
    ...l,
    evidenceUrl: ids.has(l.id) ? evidenceLink(l.id, l.updatedAt) : null,
  }));
}

/**
 * Normalise evidence sent by a client on save. Edit forms echo back the link they received,
 * so a link is resolved to the stored data URL instead of being saved as-is.
 */
export async function resolveEvidenceInput(
  input: unknown,
  user: SessionUser
): Promise<string | null> {
  if (typeof input !== "string" || input.trim().length === 0) return null;
  const value = input.trim();
  const match = value.match(EVIDENCE_LINK_RE);
  if (!match) return value;

  const source = await prisma.stepLog.findUnique({
    where: { id: match[1] },
    select: { userId: true, evidenceUrl: true },
  });
  if (!source || (source.userId !== user.id && user.role !== "SUPER_ADMIN")) return null;
  return source.evidenceUrl;
}
