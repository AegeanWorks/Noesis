import type { HistoryExport } from "./export";
import { isValidEmail, normalizeEmail } from "./researchSettings";

export interface ResearchEmailDraft {
  recipient: string;
  subject: string;
  body: string;
  mailto: string;
  filename: string;
  sessionCount: number;
  farCheckCount: number;
  adverseEventCount: number;
  participantCode: string;
}

export function researchExportFilename(
  participantCode: string,
  exportedAt: Date,
): string {
  return `noesis-research-${participantCode}-${exportedAt.toISOString().slice(0, 10)}.json`;
}

export function buildResearchEmailDraft(
  payloadJson: string,
  recipient: string,
  exportedAt: Date = new Date(),
): ResearchEmailDraft {
  const email = normalizeEmail(recipient);
  if (!isValidEmail(email)) {
    throw new Error("A valid email address is required to prepare the research email.");
  }

  let parsed: Partial<HistoryExport>;
  try {
    parsed = JSON.parse(payloadJson) as Partial<HistoryExport>;
  } catch {
    throw new Error("The research export is not valid JSON.");
  }

  const research = parsed.research;
  if (!research?.participantCode) {
    throw new Error("The export has no research consent record.");
  }

  const sessionCount =
    typeof parsed.sessionCount === "number"
      ? parsed.sessionCount
      : Array.isArray(parsed.sessions)
        ? parsed.sessions.length
        : 0;
  const farCheckCount = Array.isArray(parsed.farChecks) ? parsed.farChecks.length : 0;
  const adverseEventCount = Array.isArray(parsed.adverseEvents)
    ? parsed.adverseEvents.length
    : 0;
  const filename = researchExportFilename(research.participantCode, exportedAt);
  const subject = `Noesis research data · ${research.participantCode} · ${exportedAt
    .toISOString()
    .slice(0, 10)}`;
  const body = [
    "Noesis research data submission",
    "",
    `Participant code: ${research.participantCode}`,
    `Consent version: ${research.consentVersion}`,
    `Consent given: ${research.consentedAt}`,
    `Export prepared: ${exportedAt.toISOString()}`,
    "",
    `Sessions: ${sessionCount}`,
    `Far checks: ${farCheckCount}`,
    `Symptom reports: ${adverseEventCount}`,
    `Attachment: ${filename}`,
    "",
    "The attached JSON file contains the de-identified export. Please store it according to the approved protocol.",
    "This message was prepared locally by Noesis; the app did not send it automatically.",
  ].join("\n");
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  return {
    recipient: email,
    subject,
    body,
    mailto,
    filename,
    sessionCount,
    farCheckCount,
    adverseEventCount,
    participantCode: research.participantCode,
  };
}
