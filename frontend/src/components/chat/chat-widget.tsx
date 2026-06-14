"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { publicApi } from "@/lib/api";
import type { SuggestedAction } from "@/lib/api";
import { motionClasses } from "@/lib/motion";
import { resolvePublicSessionId } from "@/lib/session";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  suggestedAction?: SuggestedAction | null;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Ask about renting, landlord next steps, deposits, guarantors, or Advanced Rent. Contact details belong in the form.",
};

const NETWORK_FALLBACK_REPLY =
  "I cannot reach the assistant right now. The renter form is still available for agent follow-up.";

const QUICK_QUESTIONS = [
  "How does Proper Rent work?",
  "Can I see live properties?",
  "How can Deposit Share or a guarantor help?",
  "Can I book a viewing?",
] as const;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(resolvePublicSessionId());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isOpen, messages, isWaiting]);

  const intakeHref = useMemo(() => {
    if (!sessionId) {
      return site.routes.renterRegister;
    }
    return `${site.routes.renterRegister}?session_id=${encodeURIComponent(sessionId)}`;
  }, [sessionId]);
  const showQuickQuestions = !messages.some((message) => message.role === "user");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(inputValue.trim());
  }

  async function sendMessage(message: string) {
    if (!message || isWaiting) {
      return;
    }

    const activeSessionId = sessionId ?? resolvePublicSessionId();
    setSessionId(activeSessionId);
    setInputValue("");
    setMessages((current) => [
      ...current,
      { id: createMessageId("user"), role: "user", content: message },
    ]);
    setIsWaiting(true);

    try {
      const response = await publicApi.createChatReply({
        session_id: activeSessionId,
        message,
      });
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: response.reply,
          suggestedAction: response.suggested_action,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: NETWORK_FALLBACK_REPLY,
          suggestedAction: "show_intake_form",
        },
      ]);
    } finally {
      setIsWaiting(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:w-[380px]">
      {isOpen ? (
        <section
          aria-label="Proper Rent chatbot"
          className={cn(
            "mb-3 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-md",
            "border border-border bg-surface text-foreground shadow-soft",
            motionClasses.enter,
          )}
          id="proper-rent-chat-panel"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-4">
            <div>
              <h2 className="text-base font-semibold leading-6">Proper Rent assistant</h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                General guidance only. A human agent confirms live details.
              </p>
            </div>
            <button
              aria-label="Close chat"
              className="rounded-md px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
          >
            {messages.map((message) => (
              <ChatBubble
                intakeHref={intakeHref}
                key={message.id}
                message={message}
              />
            ))}
            {showQuickQuestions ? (
              <div
                aria-label="Suggested chat questions"
                className="grid gap-2 sm:grid-cols-2"
              >
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    className={cn(
                      "rounded-md border border-border bg-surface px-3 py-2 text-left text-sm",
                      "font-medium leading-5 text-foreground transition hover:border-primary",
                      "hover:bg-surface-subtle focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-primary",
                    )}
                    disabled={isWaiting}
                    key={question}
                    onClick={() => void sendMessage(question)}
                    type="button"
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : null}
            {isWaiting ? (
              <div className="max-w-[85%] rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm leading-6 text-muted motion-safe:animate-pulse motion-reduce:animate-none">
                Thinking...
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="border-t border-border p-3" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="proper-rent-chat-message">
              Chat message
            </label>
            <div className="flex gap-2">
              <TextInput
                autoComplete="off"
                id="proper-rent-chat-message"
                maxLength={1000}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask a general question"
                ref={inputRef}
                value={inputValue}
              />
              <button
                className={buttonClasses({ className: "shrink-0" })}
                disabled={!inputValue.trim() || isWaiting}
                type="submit"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        aria-controls="proper-rent-chat-panel"
        aria-expanded={isOpen}
        className={buttonClasses({
          className: "ml-auto flex shadow-soft",
          size: "lg",
        })}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? "Hide chat" : "Chat with us"}
      </button>
    </div>
  );
}

function ChatBubble({
  intakeHref,
  message,
}: {
  intakeHref: string;
  message: ChatMessage;
}) {
  const isUserMessage = message.role === "user";

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-md px-3 py-2 text-sm leading-6",
        isUserMessage
          ? "ml-auto bg-primary text-primary-foreground"
          : "border border-border bg-surface-subtle text-muted",
      )}
    >
      <p>{message.content}</p>
      {message.suggestedAction === "show_intake_form" ? (
        <Link
          className={cn(
            "mt-3 inline-flex rounded-md font-semibold underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
          href={intakeHref}
        >
          Open renter intake form
        </Link>
      ) : null}
    </div>
  );
}

function createMessageId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
