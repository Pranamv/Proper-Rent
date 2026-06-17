import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatWidget } from "@/components/chat/chat-widget";

const mocks = vi.hoisted(() => ({
  createChatReply: vi.fn(),
  resolvePublicSessionId: vi.fn(() => "session-vitest"),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    publicApi: {
      ...actual.publicApi,
      createChatReply: mocks.createChatReply,
    },
  };
});

vi.mock("@/lib/session", () => ({
  resolvePublicSessionId: mocks.resolvePublicSessionId,
}));

describe("ChatWidget", () => {
  beforeEach(() => {
    mocks.createChatReply.mockReset();
    mocks.resolvePublicSessionId.mockReturnValue("session-vitest");
  });

  it("opens, sends a message, and renders the intake suggestion", async () => {
    mocks.createChatReply.mockResolvedValue({
      reply: "An agent can help with next steps.",
      session_id: "session-vitest",
      suggested_action: "show_intake_form",
    });
    const user = userEvent.setup();

    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /open proper rent chat/i }));
    await user.type(screen.getByRole("textbox", { name: /chat message/i }), "Can I rent soon?");
    await user.click(screen.getByRole("button", { name: /send chat message/i }));

    expect(await screen.findByText("An agent can help with next steps.")).toBeInTheDocument();
    expect(mocks.createChatReply).toHaveBeenCalledWith({
      message: "Can I rent soon?",
      session_id: "session-vitest",
    });
    expect(screen.getByRole("link", { name: /open renter intake form/i })).toHaveAttribute(
      "href",
      "/register/renter?session_id=session-vitest",
    );
  });

  it("shows the network fallback with an intake action when the API fails", async () => {
    mocks.createChatReply.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();

    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /open proper rent chat/i }));
    await user.type(screen.getByRole("textbox", { name: /chat message/i }), "Hello");
    await user.click(screen.getByRole("button", { name: /send chat message/i }));

    expect(await screen.findByText(/cannot reach the assistant/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open renter intake form/i })).toBeInTheDocument();
  });
});
