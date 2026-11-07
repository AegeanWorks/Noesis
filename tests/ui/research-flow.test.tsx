// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../../src/App";
import { sessionStore } from "../../src/engine/store";
import { clearHistory } from "../../src/storage/history";
import { clearResearchConsent } from "../../src/storage/researchConsent";
import { clearResearchSettings, saveResearchSettings } from "../../src/storage/researchSettings";
import { clearSafety, saveSafety } from "../../src/storage/safety";
import { clearSessionSnapshot } from "../../src/storage/sessionSnapshot";

beforeEach(() => {
  sessionStore.reset();
  clearHistory();
  clearSessionSnapshot();
  clearResearchConsent();
  clearResearchSettings();
  saveResearchSettings({ studyContactEmail: "study@example.org" });
  saveSafety({
    acknowledged: true,
    photosensitive: false,
    exerciseConcern: false,
    consent: true,
  });
});

afterEach(() => {
  cleanup();
  sessionStore.reset();
  clearHistory();
  clearResearchConsent();
  clearResearchSettings();
  clearSafety();
  clearSessionSnapshot();
});

describe("research flow", () => {
  it("opens the consent screen from Settings and can give consent", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByTestId("research-panel")).toBeTruthy();
    fireEvent.click(screen.getByTestId("open-research-consent"));
    expect(
      screen.getByRole("heading", { name: /informed consent for research data sharing/i }),
    ).toBeTruthy();
    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    fireEvent.click(screen.getByTestId("give-consent"));
    expect(screen.getByTestId("research-consent-status").textContent).toMatch(
      /consent given/i,
    );
    expect(screen.getByTestId("send-research-data")).toBeTruthy();
  });
});
