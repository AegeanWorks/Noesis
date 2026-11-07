// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ResearchConsentScreen } from "../../src/ui/screens/ResearchConsentScreen";
import type { ResearchConsent } from "../../src/storage/researchConsent";

afterEach(cleanup);

const CONTACT = "study@example.org";

function renderScreen(
  overrides: Partial<ComponentProps<typeof ResearchConsentScreen>> = {},
) {
  const props: ComponentProps<typeof ResearchConsentScreen> = {
    studyContactEmail: CONTACT,
    existingConsent: null,
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ResearchConsentScreen {...props} />);
  return props;
}

describe("ResearchConsentScreen", () => {
  it("shows the required consent sections and gates the button", () => {
    const onComplete = vi.fn();
    renderScreen({ onComplete });
    expect(
      screen.getByRole("heading", { name: /informed consent for research data sharing/i }),
    ).toBeTruthy();
    expect(screen.getByText(/what data is included/i)).toBeTruthy();
    expect(screen.getByText(/voluntary participation/i)).toBeTruthy();
    expect(screen.getByText(/withdrawal/i)).toBeTruthy();
    expect(screen.getAllByText(new RegExp(CONTACT)).length).toBeGreaterThan(0);
    const submit = screen.getByTestId("give-consent") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    expect(onComplete).toHaveBeenCalledTimes(1);
    const consent = onComplete.mock.calls[0]?.[0] as ResearchConsent;
    expect(consent.studyContactEmail).toBe(CONTACT);
    expect(consent.scopes).toEqual({ dataSharing: true, futureArticles: true });
    expect(consent.participantCode).toMatch(/^N-/);
    expect(Number.isFinite(Date.parse(consent.consentedAt))).toBe(true);
  });

  it("switches between English and Turkish", () => {
    renderScreen();
    fireEvent.click(screen.getByTestId("research-consent-language-tr"));
    expect(
      screen.getByRole("heading", { name: /aydınlatılmış onam/i }),
    ).toBeTruthy();
    expect(screen.getByText(/gönüllü katılım/i)).toBeTruthy();
    fireEvent.click(screen.getByTestId("research-consent-language-en"));
    expect(
      screen.getByRole("heading", { name: /informed consent for research data sharing/i }),
    ).toBeTruthy();
  });

  it("blocks consent when the study contact is missing", () => {
    renderScreen({ studyContactEmail: "" });
    expect(screen.getByText(/contact email is not configured/i)).toBeTruthy();
    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    expect((screen.getByTestId("give-consent") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows an existing active consent without asking again", () => {
    const existing: ResearchConsent = {
      version: 1,
      participantCode: "N-EXIST123",
      consentedAt: "2026-11-08T10:00:00.000Z",
      withdrawnAt: null,
      scopes: { dataSharing: true, futureArticles: true },
      studyContactEmail: CONTACT,
      language: "en",
    };
    renderScreen({ existingConsent: existing });
    expect(screen.getByText(/consent already given/i)).toBeTruthy();
    expect(screen.getByText(/N-EXIST123/)).toBeTruthy();
    expect(screen.queryByTestId("give-consent")).toBeNull();
  });

  it("offers re-consent after withdrawal", () => {
    const withdrawn: ResearchConsent = {
      version: 1,
      participantCode: "N-EXIST123",
      consentedAt: "2026-11-08T10:00:00.000Z",
      withdrawnAt: "2026-11-09T10:00:00.000Z",
      scopes: { dataSharing: true, futureArticles: true },
      studyContactEmail: CONTACT,
      language: "en",
    };
    renderScreen({ existingConsent: withdrawn });
    expect(screen.getByTestId("consent-withdrawn").textContent).toMatch(/withdrawn/i);
    expect(screen.getByTestId("give-consent")).toBeTruthy();
  });

  it("asks again when the stored consent version is stale", () => {
    const stale: ResearchConsent = {
      version: 0,
      participantCode: "N-OLD12345",
      consentedAt: "2026-01-01T10:00:00.000Z",
      withdrawnAt: null,
      scopes: { dataSharing: true, futureArticles: true },
      studyContactEmail: CONTACT,
      language: "en",
    };
    renderScreen({ existingConsent: stale });
    expect(screen.getByText(/consent text has changed/i)).toBeTruthy();
    expect(screen.getByTestId("give-consent")).toBeTruthy();
  });
});
