// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ResearchDataPanel } from "../../src/ui/components/ResearchDataPanel";
import type { ResearchEmailDraft } from "../../src/storage/researchEmail";
import type { ResearchConsent } from "../../src/storage/researchConsent";

afterEach(cleanup);

const CONSENT: ResearchConsent = {
  version: 1,
  participantCode: "N-ABC12345",
  consentedAt: "2026-11-08T10:00:00.000Z",
  withdrawnAt: null,
  scopes: { dataSharing: true, futureArticles: true },
  studyContactEmail: "study@example.org",
  language: "en",
};

const DRAFT: ResearchEmailDraft = {
  recipient: "study@example.org",
  subject: "Noesis research data · N-ABC12345 · 2026-11-08",
  body: "Participant code: N-ABC12345\nSessions: 2",
  mailto: "mailto:study%40example.org?subject=Noesis&body=Participant",
  filename: "noesis-research-N-ABC12345-2026-11-08.json",
  sessionCount: 2,
  farCheckCount: 1,
  adverseEventCount: 0,
  participantCode: "N-ABC12345",
};

function renderPanel(
  overrides: Partial<ComponentProps<typeof ResearchDataPanel>> = {},
) {
  const props: ComponentProps<typeof ResearchDataPanel> = {
    settings: { studyContactEmail: "study@example.org" },
    consent: CONSENT,
    draft: null,
    error: null,
    onStudyContactEmail: vi.fn(),
    onOpenConsent: vi.fn(),
    onWithdrawConsent: vi.fn(),
    onPrepareEmail: vi.fn(),
    ...overrides,
  };
  render(<ResearchDataPanel {...props} />);
  return props;
}

describe("ResearchDataPanel", () => {
  it("links the export rationale to the FAIR principles", () => {
    renderPanel({ consent: null });
    const note = screen.getByTestId("fair-evidence");
    expect(note.textContent).toMatch(/FAIR principles/i);
    expect(note.querySelector("a")?.getAttribute("href")).toBe(
      "https://pubmed.ncbi.nlm.nih.gov/26978244/",
    );
  });

  it("requires consent before sending", () => {
    const props = renderPanel({ consent: null });
    expect(screen.getByText(/consent not given/i)).toBeTruthy();
    const send = screen.getByTestId("send-research-data") as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.click(screen.getByTestId("open-research-consent"));
    expect(props.onOpenConsent).toHaveBeenCalledTimes(1);
  });

  it("requires a valid study email", () => {
    renderPanel({ settings: { studyContactEmail: "not-an-email" } });
    expect(screen.getByText(/valid study email/i)).toBeTruthy();
    expect((screen.getByTestId("send-research-data") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("blocks sending when the study email changed after consent", () => {
    renderPanel({ settings: { studyContactEmail: "new@example.org" } });
    expect(screen.getByTestId("research-contact-changed")).toBeTruthy();
    expect((screen.getByTestId("send-research-data") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("lets a consented participant prepare the email", () => {
    const props = renderPanel();
    expect(screen.getByText(/consent given/i)).toBeTruthy();
    expect(screen.getByText(/N-ABC12345/)).toBeTruthy();
    const send = screen.getByTestId("send-research-data") as HTMLButtonElement;
    expect(send.disabled).toBe(false);
    fireEvent.click(send);
    expect(props.onPrepareEmail).toHaveBeenCalledTimes(1);
  });

  it("shows the download filename and email draft instructions", () => {
    renderPanel({ draft: DRAFT });
    expect(
      screen.getAllByText(/noesis-research-N-ABC12345-2026-11-08\.json/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/attach/i)).toBeTruthy();
    expect(screen.getByText(/study@example\.org/)).toBeTruthy();
    const link = screen.getByTestId("open-email-app") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(DRAFT.mailto);
    expect(link.textContent).toMatch(/open email app/i);
  });

  it("withdraws consent on request", () => {
    const props = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw research consent" }));
    expect(props.onWithdrawConsent).toHaveBeenCalledTimes(1);
  });

  it("edits the study contact email", () => {
    const props = renderPanel();
    fireEvent.change(screen.getByLabelText(/study team email/i), {
      target: { value: "new@example.org" },
    });
    expect(props.onStudyContactEmail).toHaveBeenCalledWith("new@example.org");
  });
});
