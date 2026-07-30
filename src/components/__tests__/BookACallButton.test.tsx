import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookACallButton } from "../BookACallButton";

// The button is a top-level new-tab open, not the Cal modal embed (Cloudflare
// blocks that from inside an iframe — see src/lib/cal.ts). So the only thing
// worth asserting is the URL it opens.
let openSpy: ReturnType<typeof vi.spyOn>;

describe("BookACallButton", () => {
  beforeEach(() => {
    openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
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

  it("opens the public booking page in a new tab on click", async () => {
    const user = userEvent.setup();
    render(<BookACallButton calLink="user/30min" />);

    await user.click(screen.getByRole("button", { name: /book a call/i }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://cal.com/user/30min",
      "_blank",
      "noopener,noreferrer",
    );
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
    expect(openSpy).toHaveBeenCalledWith(
      "https://cal.com/user/30min",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("bare variant renders nothing when calLink is empty", () => {
    const { container } = render(
      <BookACallButton calLink={null} variant="bare" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
