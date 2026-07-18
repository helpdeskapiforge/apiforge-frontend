import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWorkspaceDialog from "@/components/workspace/CreateWorkspaceDialog";
import api from "@/lib/api";
import { toast } from "sonner";

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CreateWorkspaceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a workspace, shows a success toast, and closes", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 1, name: "My Workspace" } } as never);

    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(<CreateWorkspaceDialog open={true} onOpenChange={onOpenChange} onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/personal projects/i), "My Workspace");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/workspaces/create", { name: "My Workspace" });
    });

    expect(toast.success).toHaveBeenCalledWith("Workspace created.");
    expect(onSuccess).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the backend's real error message on failure, and does not close the dialog", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { status: 400, data: { message: "A workspace with that name already exists." } },
      isAxiosError: true,
    } as never);

    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(<CreateWorkspaceDialog open={true} onOpenChange={onOpenChange} onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText(/personal projects/i), "Duplicate");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("A workspace with that name already exists.");
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("disables the submit button until a name is entered", () => {
    render(<CreateWorkspaceDialog open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByRole("button", { name: /create workspace/i })).toBeDisabled();
  });
});
