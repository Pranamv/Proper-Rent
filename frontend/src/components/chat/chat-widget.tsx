"use client";

import { ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { TextInput } from "@/components/ui/field";
import { publicApi } from "@/lib/api";
import type { ChatHistoryMessage, SuggestedAction } from "@/lib/api";
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
    "Ask a general question about renting, deposits, guarantors, or landlord next steps. Contact details belong in the form.",
};

const NETWORK_FALLBACK_REPLY =
  "I cannot reach the assistant right now. The renter form is still available for agent follow-up.";

const QUICK_QUESTIONS = [
  "How does Proper Rent work?",
  "Can I book a viewing?",
  "Can Deposit Share help?",
  "I am a landlord",
] as const;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasUnreadReply, setHasUnreadReply] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpenRef = useRef(isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const restoredSessionRef = useRef<string | null>(null);

  useEffect(() => {
    setSessionId(resolvePublicSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId || restoredSessionRef.current === sessionId) {
      return;
    }

    let isCancelled = false;
    restoredSessionRef.current = sessionId;

    void publicApi
      .getChatHistory(sessionId)
      .then((history) => {
        if (isCancelled || history.session_id !== sessionId || history.messages.length === 0) {
          return;
        }

        setMessages((current) => {
          if (current.some((message) => message.role === "user")) {
            return current;
          }
          return restoreChatMessages(history.messages);
        });
      })
      .catch(() => {
        // History restore is best-effort; sending new chat messages should still work.
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    isOpenRef.current = isOpen;

    if (!isOpen) {
      return;
    }

    setHasUnreadReply(false);
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
      if (!isOpenRef.current) {
        setHasUnreadReply(true);
      }
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
      if (!isOpenRef.current) {
        setHasUnreadReply(true);
      }
    } finally {
      setIsWaiting(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:w-[400px]">
      {isOpen ? (
        <section
          aria-label="Proper Rent chatbot"
          className={cn(
            "mb-3 flex max-h-[min(640px,calc(100vh-2rem))] flex-col overflow-hidden rounded-xl",
            "border border-border bg-surface text-foreground shadow-[0_24px_80px_rgb(20_51_45_/_18%)]",
            motionClasses.enter,
          )}
          id="proper-rent-chat-panel"
        >
          <div className="border-b border-border bg-surface-subtle px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"
                  aria-hidden="true"
                >
                  <ChatCircleDots size={21} weight="bold" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold leading-5 text-foreground">
                    Proper Rent assistant
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs leading-5 text-muted">
                    <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                    General guidance before agent follow-up
                  </p>
                </div>
              </div>
              <button
                aria-label="Close chat"
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full text-muted",
                  "transition hover:bg-surface hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-background/45 p-4"
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
                className="flex flex-wrap gap-2 pt-1"
              >
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    className={cn(
                      "rounded-full border border-border bg-surface px-3 py-2 text-left text-xs",
                      "font-bold leading-4 text-foreground shadow-sm transition hover:border-primary",
                      "hover:bg-accent focus-visible:outline-none",
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
              <div className="flex max-w-[82%] items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-surface px-3 py-2 text-sm leading-6 text-muted shadow-sm">
                <span className="sr-only">Thinking...</span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none" />
                  <span className="size-1.5 rounded-full bg-primary/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <span className="size-1.5 rounded-full bg-primary/40 motion-safe:animate-pulse motion-reduce:animate-none" />
                </span>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="border-t border-border bg-surface p-3" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="proper-rent-chat-message">
              Chat message
            </label>
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-subtle p-1.5 transition focus-within:border-primary">
              <TextInput
                autoComplete="off"
                className={cn(
                  "h-10 rounded-full border-0 bg-transparent px-3 shadow-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                )}
                id="proper-rent-chat-message"
                maxLength={1000}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask a general question"
                ref={inputRef}
                value={inputValue}
              />
              <button
                aria-label="Send chat message"
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground",
                  "transition hover:bg-primary/90 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  "disabled:pointer-events-none disabled:opacity-45",
                )}
                disabled={!inputValue.trim() || isWaiting}
                type="submit"
              >
                <PaperPlaneRight size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 px-2 text-xs leading-5 text-muted">
              Please use the registration form for contact details.
            </p>
          </form>
        </section>
      ) : null}

      <button
        aria-controls="proper-rent-chat-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide Proper Rent chat" : "Open Proper Rent chat"}
        className={cn(
          "relative ml-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground",
          "shadow-[0_16px_40px_rgb(20_51_45_/_24%)] transition hover:-translate-y-0.5",
          "hover:bg-primary/90 active:translate-y-0 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "focus-visible:ring-offset-4 focus-visible:ring-offset-background",
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {hasUnreadReply ? (
          <span
            className="absolute -right-0.5 -top-0.5 size-4 rounded-full border-2 border-background bg-accent-spark"
            aria-hidden="true"
          />
        ) : null}
        <ChatCircleDots size={29} weight="bold" aria-hidden="true" />
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
        "max-w-[86%] px-3.5 py-2.5 text-sm leading-6 shadow-sm",
        isUserMessage
          ? "ml-auto rounded-2xl rounded-br-md bg-primary text-primary-foreground"
          : "rounded-2xl rounded-bl-md border border-border bg-surface text-muted",
      )}
    >
      <p>{message.content}</p>
      {message.suggestedAction === "show_intake_form" ? (
        <Link
          className={cn(
            "mt-3 inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground no-underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
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

function restoreChatMessages(historyMessages: ChatHistoryMessage[]): ChatMessage[] {
  const restoredMessages = historyMessages
    .filter((message) => message.content.trim().length > 0)
    .map((message, index) => ({
      id: `history-${index}-${message.ts ?? message.role}`,
      role: message.role,
      content: message.content,
      suggestedAction: message.suggested_action ?? null,
    }));

  return restoredMessages.length > 0 ? restoredMessages : [INITIAL_MESSAGE];
}
