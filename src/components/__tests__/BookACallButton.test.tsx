import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookACallButton } from "../BookACallButton";

// Mock next-themes so the hook resolves a theme without a provider.
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

// Mock the Cal loader so no real embed.js is injected during tests.
// loadCal is async (dynamic-imports the snippet), so the mock returns a promise.
const calSpy = vi.fn();
const loadCalMock = vi.fn(async () => calSpy);
vi.mock("@/lib/cal", () => ({
  loadCal: () => loadCalMock(),
  calFallbackUrl: (link: string) => `https://cal.com/${link}`,
}));

describe("BookACallButton", () => {
  beforeEach(() => {
    calSpy.mockReset();
    loadCalMock.mockReset();
    loadCalMock.mockImplementation(async () => calSpy);
  });

  it("renders nothing when calLink is empty", () => {
    const { container } = render(<BookACallButton calLink={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when calLink is an empty string", () => {
    const { container } = render(<BookACallButton calLink="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the button when calLink is present", () => {
    render(<BookACallButton calLink="user/30min" />);
    expect(
      screen.getByRole("button", { name: /book a call/i }),
    ).toBeInTheDocument();
  });

  it("bare variant renders a plain button with the passed className and still opens", async () => {
    const user = userEvent.setup();
    render(
      <BookACallButton
        calLink="user/30min"
        variant="bare"
        className="my-hero-btn"
      />,
    );
    const btn = screen.getByRole("button", { name: /book a call/i });
    expect(btn).toHaveClass("my-hero-btn");

    await user.click(btn);
    await waitFor(() => {
      expect(calSpy).toHaveBeenCalledWith("modal", {
        calLink: "user/30min",
        config: { theme: "light" },
      });
    });
  });

  it("bare variant renders nothing when calLink is empty", () => {
    const { container } = render(
      <BookACallButton calLink={null} variant="bare" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the Cal modal on click with the calLink and theme", async () => {
    const user = userEvent.setup();
    render(<BookACallButton calLink="user/30min" />);

    await user.click(screen.getByRole("button", { name: /book a call/i }));

    await waitFor(() => {
      expect(calSpy).toHaveBeenCalledWith("modal", {
        calLink: "user/30min",
        config: { theme: "light" },
      });
    });
    expect(loadCalMock).toHaveBeenCalledTimes(1);
    expect(calSpy).toHaveBeenCalledWith("ui", { theme: "light" });
  });

  it("falls back to opening a new tab when the embed fails to load", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    loadCalMock.mockImplementation(async () => {
      throw new Error("embed.js blocked");
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<BookACallButton calLink="user/30min" />);
    await user.click(screen.getByRole("button", { name: /book a call/i }));

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        "https://cal.com/user/30min",
        "_blank",
        "noopener,noreferrer",
      );
    });
    openSpy.mockRestore();
    errSpy.mockRestore();
  });
});
