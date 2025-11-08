import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Home from "./home";

describe("Home route", () => {
  it("renders welcome message", () => {
    render(<Home />);
    const element = screen.getByText(/Welcome to Poker Sense/i);
    expect(element).toBeDefined();
  });

  it("renders coming soon message", () => {
    render(<Home />);
    const element = screen.getByText(/coming soon/i);
    expect(element).toBeDefined();
  });
});
