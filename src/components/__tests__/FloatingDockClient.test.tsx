import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingDockClient } from "../FloatingDockClient";

// Clerk: signed out (no Sign Out item) by default.
const safeClerk = { isSignedIn: false, signOut: vi.fn() };
vi.mock("@/hooks/use-safe-clerk", () => ({
  useSafeClerk: () => safeClerk,
}));

// DynamicIcon: render a marker so we can assert socials render.
vi.mock("../DynamicIcon", () => ({
  DynamicIcon: () => <span data-testid="dyn-icon" />,
}));

// Booking hook: control enabled/openModal per test.
const openModal = vi.fn();
let bookingEnabled = true;
vi.mock("../BookACallButton", () => ({
  useBookACall: () => ({ openModal, enabled: bookingEnabled, pending: false }),
}));

// Section anchors (scroll-spy index) + one external social (footer).
const NAV = [
  { title: "About", href: "#about", icon: "IconUser", isExternal: false },
  { title: "Skills", href: "#skills", icon: "IconCode", isExternal: false },
  {
    title: "GitHub",
    href: "https://github.com/x",
    icon: "IconBrandGithub",
    isExternal: true,
  },
];

describe("FloatingDockClient — side rail", () => {
  beforeEach(() => {
    openModal.mockReset();
    bookingEnabled = true;
    safeClerk.isSignedIn = false;
  });

  it("renders section anchors as the index (desktop + mobile copies)", () => {
    render(<FloatingDockClient navItems={NAV} calLink={null} />);
    // Rendered in both the desktop rail and the mobile sheet.
    expect(screen.getAllByText("About").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Skills").length).toBeGreaterThan(0);
  });

  it("[REGRESSION] omits the booking action when calLink is null", () => {
    bookingEnabled = false;
    render(<FloatingDockClient navItems={NAV} calLink={null} />);
    expect(screen.getAllByText("About").length).toBeGreaterThan(0);
    expect(screen.queryByText("Book a call")).not.toBeInTheDocument();
  });

  it("injects a 'Book a call' action when calLink is present", () => {
    render(<FloatingDockClient navItems={NAV} calLink="user/30min" />);
    expect(screen.getAllByText("Book a call").length).toBeGreaterThan(0);
  });

  it("invokes openModal when a 'Book a call' action is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<FloatingDockClient navItems={NAV} calLink="user/30min" />);
    await user.click(screen.getAllByText("Book a call")[0]);
    expect(openModal).toHaveBeenCalled();
  });

  it("renders external items as social links, not index entries", () => {
    render(<FloatingDockClient navItems={NAV} calLink={null} />);
    const github = screen.getAllByLabelText("GitHub");
    expect(github.length).toBeGreaterThan(0);
    expect(github[0].getAttribute("href")).toBe("https://github.com/x");
    expect(github[0].getAttribute("target")).toBe("_blank");
  });

  it("renders nothing when there is no nav and no booking", () => {
    bookingEnabled = false;
    const { container } = render(
      <FloatingDockClient navItems={[]} calLink={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
