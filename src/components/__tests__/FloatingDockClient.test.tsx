import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingDockClient } from "../FloatingDockClient";

// Clerk: signed out (no Sign Out item) by default.
const safeClerk = { isSignedIn: false, signOut: vi.fn() };
vi.mock("@/hooks/use-safe-clerk", () => ({
  useSafeClerk: () => safeClerk,
}));

// Sidebar context: closed, desktop.
vi.mock("../ui/sidebar", () => ({
  useSidebar: () => ({ open: false, isMobile: false, openMobile: false }),
}));

// DynamicIcon: render the icon name so we can assert on nav titles via tooltip.
vi.mock("../DynamicIcon", () => ({
  DynamicIcon: () => <span data-testid="dyn-icon" />,
}));

// Booking hook: control enabled/openModal per test.
const openModal = vi.fn();
let bookingEnabled = true;
vi.mock("../BookACallButton", () => ({
  useBookACall: () => ({ openModal, enabled: bookingEnabled, pending: false }),
}));

const NAV = [
  { title: "Home", href: "/", icon: "IconHome", isExternal: false },
  { title: "About", href: "/about", icon: "IconUser", isExternal: false },
];

describe("FloatingDockClient — booking integration", () => {
  beforeEach(() => {
    openModal.mockReset();
    bookingEnabled = true;
    safeClerk.isSignedIn = false;
  });

  it("[REGRESSION] renders existing nav items when calLink is null (booking disabled)", () => {
    bookingEnabled = false;
    render(<FloatingDockClient navItems={NAV} calLink={null} />);

    // Nav tooltips still present; no "Book a call".
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("About").length).toBeGreaterThan(0);
    expect(screen.queryByText("Book a call")).not.toBeInTheDocument();
  });

  it("injects a 'Book a call' action when calLink is present", () => {
    render(<FloatingDockClient navItems={NAV} calLink="user/30min" />);
    expect(screen.getAllByText("Book a call").length).toBeGreaterThan(0);
  });

  it("[REGRESSION] keeps all nav items visible alongside the booking action (within cap)", () => {
    render(<FloatingDockClient navItems={NAV} calLink="user/30min" />);
    // 2 nav + 1 booking = 3 items, under the 6-item desktop cap — all visible.
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("About").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Book a call").length).toBeGreaterThan(0);
  });

  it("invokes openModal when the booking action is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<FloatingDockClient navItems={NAV} calLink="user/30min" />);

    // Desktop dock renders the booking item as a button (onClick branch).
    const bookingButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent === "" || b.querySelector("svg"));
    // Click the first dock button (booking is unshifted to front).
    await user.click(bookingButtons[0]);
    expect(openModal).toHaveBeenCalled();
  });
});
