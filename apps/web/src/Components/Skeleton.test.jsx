import React from "react";
import { render, screen } from "@testing-library/react";
import { SkeletonPulse, CardSkeleton, TableSkeleton, ChartSkeleton, MapSkeleton } from "./Skeleton";

describe("Skeleton Components Suite", () => {
  describe("SkeletonPulse", () => {
    it("renders with default placeholder when no children are provided", () => {
      render(<SkeletonPulse data-testid="pulse" />);
      const placeholder = screen.getByText("placeholder");
      expect(placeholder).toBeInTheDocument();
      expect(placeholder.parentElement).toHaveClass("animate-pulse");
    });

    it("renders children when provided", () => {
      render(
        <SkeletonPulse>
          <span data-testid="child">Test Child</span>
        </SkeletonPulse>
      );
      const child = screen.getByTestId("child");
      expect(child).toBeInTheDocument();
      expect(screen.queryByText("placeholder")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<SkeletonPulse className="custom-class" data-testid="pulse-wrapper" />);
      const elements = document.getElementsByClassName("custom-class");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("CardSkeleton", () => {
    it("renders standard card skeleton elements", () => {
      const { container } = render(<CardSkeleton />);
      // Should have a wrapper with card borders and shadow styles
      const card = container.firstChild;
      expect(card).toHaveClass("p-6", "border", "rounded-2xl");
    });
  });

  describe("TableSkeleton", () => {
    it("renders the correct number of rows and columns", () => {
      // 3 rows, 4 columns
      const { container } = render(<TableSkeleton rows={3} cols={4} />);
      
      // We expect 1 header block and 3 row blocks -> total 4 row-like container elements
      // Inside each row-like block we should have 4 skeleton pulse elements
      const pulseDivs = container.querySelectorAll(".animate-pulse");
      // 1 header row (4 cols) + 3 body rows (3 * 4 cols) = 16 pulse divs
      expect(pulseDivs.length).toBe(16);
    });
  });

  describe("ChartSkeleton", () => {
    it("renders chart mock elements", () => {
      render(<ChartSkeleton />);
      // Should render opacity-40 lines to mockup graph grids
      const grids = document.getElementsByClassName("opacity-40");
      expect(grids.length).toBe(4);
    });
  });

  describe("MapSkeleton", () => {
    it("renders map loading skeleton components", () => {
      render(<MapSkeleton />);
      // Should show toolbar buttons (e.g. top-4 left-4 tools)
      const pulseDivs = document.getElementsByClassName("animate-pulse");
      expect(pulseDivs.length).toBeGreaterThan(3);
    });
  });
});
