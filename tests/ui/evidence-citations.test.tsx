// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MECHANIC_META } from "../../src/engine/evidence";
import { EvidenceScreen } from "../../src/ui/screens/EvidenceScreen";

afterEach(cleanup);

describe("evidence citation rows", () => {
  it("exposes every citation as one PubMed link carrying its PMID", () => {
    render(<EvidenceScreen onHome={vi.fn()} />);
    const links = screen.getAllByRole("link");
    const mechanicCitations = Object.values(MECHANIC_META).reduce(
      (count, meta) => count + meta.citations.length,
      0,
    );
    expect(links).toHaveLength(mechanicCitations + 67);
    for (const link of links) {
      expect(link.textContent).toMatch(/PMID \d+/);
      expect(link.getAttribute("href")).toMatch(
        /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/,
      );
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
    const gradient = screen.getByTestId("transfer-gradient-evidence");
    expect(gradient.textContent).toMatch(/far transfer rarely occurs/i);
    expect(gradient.querySelector("a")?.getAttribute("href")).toBe(
      "https://pubmed.ncbi.nlm.nih.gov/29276344/",
    );
    const support = screen.getByTestId("transfer-support-evidence");
    expect(support.textContent).toMatch(/task-specific/i);
    expect(support.querySelectorAll("a")).toHaveLength(8);
    const mechanism = screen.getByTestId("mechanism-evidence");
    expect(mechanism.textContent).toMatch(/mechanism markers/i);
    expect(mechanism.querySelectorAll("a")).toHaveLength(6);
    expect(mechanism.textContent).toMatch(/neurofeedback of neural signals rarely improved/i);
    expect(screen.getByText(/lacked protocol guidance and process checks/i)).toBeTruthy();
    expect(screen.getByText(/insufficient evidence neurofeedback treats fatigue/i)).toBeTruthy();
    expect(screen.getByText(/blind placebo-controlled neurofeedback showed no neurocognitive gain/i)).toBeTruthy();
    const notSupported = screen.getByTestId("not-supported-list");
    expect(notSupported.textContent).toMatch(/ADHD symptom treatment/i);
    expect(notSupported.textContent).toMatch(/Everyday-function benefit/i);
    expect(notSupported.textContent).toMatch(/combining exercise/i);
    expect(notSupported.textContent).toMatch(/baseline expectancy/i);
    expect(notSupported.textContent).toMatch(/mood-disorder treatment/i);
    expect(notSupported.textContent).toMatch(/active controls/i);
    expect(notSupported.textContent).toMatch(/dementia-prevention/i);
    expect(notSupported.textContent).toMatch(/validated screening tool/i);
    expect(notSupported.textContent).toMatch(/replace established interventions/i);
    expect(notSupported.textContent).toMatch(/child-development or academic/i);
    expect(notSupported.textContent).toMatch(/durable mood benefit/i);
    expect(notSupported.textContent).toMatch(/validated baseline profile/i);
    expect(notSupported.textContent).toMatch(/dementia prevention claim/i);
    expect(notSupported.textContent).toMatch(/broad transfer to untrained domains/i);
    expect(notSupported.textContent).toMatch(/domain-specific leisure-game gains/i);
    expect(screen.getByText(/commercial game gains were domain-selective/i)).toBeTruthy();
    expect(notSupported.textContent).toMatch(/transfer to ADHD symptoms/i);
    expect(notSupported.textContent).toMatch(/child WM gains did not reach academics/i);
    expect(notSupported.textContent).toMatch(/isolated cognitive stimulation showed no benefit/i);
    expect(screen.getByText(/balance gains came from movement-based exergames/i)).toBeTruthy();
    expect(notSupported.textContent).toMatch(/everyday-life generalization remains unresolved/i);
    expect(screen.getByText(/no clinical benefit claim/i)).toBeTruthy();
    expect(screen.getByText(/training did not improve general cognition/i)).toBeTruthy();
    expect(screen.getByText(/only 7 of 18 commercial programs/i)).toBeTruthy();
    expect(notSupported.querySelectorAll("a")).toHaveLength(27);
    expect(screen.getByText(/lacked everyday-function indicators/i)).toBeTruthy();
    expect(screen.getByText(/game scores correlate only moderately/i)).toBeTruthy();
    expect(screen.getByText(/behavior gains lacked active controls/i)).toBeTruthy();
    expect(screen.getByText(/combined training added no memory or global-cognition benefit/i)).toBeTruthy();
  });
});
