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
    expect(links).toHaveLength(mechanicCitations + 45);
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
    expect(mechanism.querySelectorAll("a")).toHaveLength(2);
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
    expect(notSupported.querySelectorAll("a")).toHaveLength(17);
  });
});
