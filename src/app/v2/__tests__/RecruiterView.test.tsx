import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TerminalProfile } from "@/components/terminal/commands";
import { RecruiterView } from "../RecruiterView";

const profile = (over: Partial<TerminalProfile> = {}): TerminalProfile => ({
  firstName: "Shoaib",
  lastName: "Ud Din",
  ...over,
});

describe("RecruiterView", () => {
  // [REGRESSION] The booking link used to be hardcoded to
  // cal.com/shoaibuddin/intro — an event type that no longer exists — while the
  // rest of the site read calLink from Sanity. Keep it sourced from the profile.
  it("builds the booking link from the profile's calLink", () => {
    render(<RecruiterView profile={profile({ calLink: "someone/30min" })} />);

    expect(screen.getByRole("link", { name: /book a/i })).toHaveAttribute(
      "href",
      "https://cal.com/someone/30min",
    );
  });

  it("omits the booking link when the profile has no calLink", () => {
    render(<RecruiterView profile={profile()} />);

    expect(screen.queryByRole("link", { name: /book a/i })).toBeNull();
  });

  it("always offers the resume download", () => {
    render(<RecruiterView profile={profile()} />);

    expect(screen.getByRole("link", { name: "resume.pdf" })).toHaveAttribute(
      "href",
      "/api/resume",
    );
  });
});
