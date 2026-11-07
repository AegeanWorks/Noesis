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
    expect(links).toHaveLength(mechanicCitations + 3);
    for (const link of links) {
      expect(link.textContent).toMatch(/PMID \d+/);
      expect(link.getAttribute("href")).toMatch(
        /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/,
      );
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
  });
});
