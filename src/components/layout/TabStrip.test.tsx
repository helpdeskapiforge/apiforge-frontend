import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TabStrip from "@/components/layout/TabStrip";
import { useDashboard } from "@/context/DashboardContext";

vi.mock("@/context/DashboardContext", () => ({
  useDashboard: vi.fn(),
}));

const baseTabs = [
  { id: "request-editor-1", editorType: "request-editor" as const, entityId: 1, module: "requests" as const, title: "Get Users" },
  { id: "request-editor-2", editorType: "request-editor" as const, entityId: 2, module: "requests" as const, title: "Create User" },
];

function mockDashboard(overrides: Partial<ReturnType<typeof useDashboard>> = {}) {
  const value = {
    tabs: baseTabs,
    activeTabId: "request-editor-1",
    setActiveTabId: vi.fn(),
    closeTab: vi.fn(),
    closeOtherTabs: vi.fn(),
    closeAllTabs: vi.fn(),
    pinTab: vi.fn(),
    openScratchpad: vi.fn(),
    ...overrides,
  };
  vi.mocked(useDashboard).mockReturnValue(value as never);
  return value;
}

describe("TabStrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regression test for the original bug: clicking a tab to switch to it also
  // popped open the tab's "Close / Pin" dropdown menu underneath, because the
  // whole row was a DropdownMenuTrigger. A left click should ONLY switch tabs.
  it("switches the active tab on a plain left click, without opening the tab's action menu", async () => {
    const dashboard = mockDashboard();
    const user = userEvent.setup();
    render(<TabStrip />);

    await user.click(screen.getByText("Create User"));

    expect(dashboard.setActiveTabId).toHaveBeenCalledWith("request-editor-2");
    expect(screen.queryByText("Close tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Pin tab")).not.toBeInTheDocument();
  });

  it("opens the action menu on right-click, and closes the tab from it", async () => {
    const dashboard = mockDashboard();
    const user = userEvent.setup();
    render(<TabStrip />);

    await user.pointer({ keys: "[MouseRight]", target: screen.getByText("Get Users") });
    expect(await screen.findByText("Close tab")).toBeInTheDocument();

    await user.click(screen.getByText("Close tab"));
    expect(dashboard.closeTab).toHaveBeenCalledWith("request-editor-1");
  });

  it("closes a tab from its hover-visible close button without switching to a different tab first", async () => {
    const dashboard = mockDashboard();
    const user = userEvent.setup();
    render(<TabStrip />);

    await user.click(screen.getByLabelText("Close Create User"));

    expect(dashboard.closeTab).toHaveBeenCalledWith("request-editor-2");
    expect(dashboard.setActiveTabId).not.toHaveBeenCalledWith("request-editor-2");
  });

  it("shows a 'New tab' affordance when there are no open tabs", () => {
    mockDashboard({ tabs: [], activeTabId: null });
    render(<TabStrip />);
    expect(screen.getByText("New tab")).toBeInTheDocument();
  });
});
