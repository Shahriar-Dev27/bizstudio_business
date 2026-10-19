"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { ChatMessage } from "@/types/advisor";
import type {
  AdvisorRequest,
  AnswerMode,
  ChatAction,
  ChatEvent,
  ReasoningMode,
  SavedConversation,
} from "@/types/chat";
import {
  chatReducer,
  createConversation,
  initialChatState,
} from "@/lib/chat/reducer";
import { buildRequestHistory } from "@/lib/chat/history";
import { readSse } from "@/lib/chat/sse";
import { ChatError, ERROR_MESSAGES } from "@/lib/chat/errors";
import { loadSession, saveSession } from "@/lib/chat/storage";
import { isRoadmapRequest } from "@/lib/chat/roadmap";
type Active = {
  controller: AbortController;
  attemptId: string;
  conversationId: string;
  jobId?: string;
};
export function useAdvisorChat() {
  const [state, dispatch] = useReducer(
      chatReducer,
      undefined,
      initialChatState,
    ),
    stateRef = useRef(state),
    active = useRef<Active | null>(null),
    mounted = useRef(true);
  const [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [unsaved, setUnsaved] = useState(false),
    [reasoning, setReasoning] = useState<ReasoningMode>("auto");
  const undoRef = useRef<SavedConversation | null>(null),
    [canUndo, setCanUndo] = useState(false),
    readyRef = useRef(false);
  const apply = useCallback((action: ChatAction) => {
    if (!mounted.current) return;
    stateRef.current = chatReducer(stateRef.current, action);
    dispatch(action);
  }, []);
  const stop = useCallback(() => {
    const current = active.current;
    if (!current) return;
    if (current.jobId)
      void fetch(`/api/advisor/jobs/${current.jobId}`, {
        method: "DELETE",
        keepalive: true,
      }).catch(() => undefined);
    current.controller.abort();
  }, []);
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      const saved = loadSession();
      if (saved) apply({ type: "replace", value: saved });
      readyRef.current = true;
      setReady(true);
    }, 0);
    const flush = () => {
      if (readyRef.current) saveSession(stateRef.current);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      mounted.current = false;
      window.removeEventListener("pagehide", flush);
      clearTimeout(timer);
      stop();
    };
  }, [apply, stop]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      const {
        id,
        title,
        updatedAt,
        messages,
        draft,
        profile,
        completedSteps,
        locale,
        revision,
      } = state;
      const result = saveSession({
        schemaVersion: 1,
        id,
        title,
        updatedAt,
        messages,
        draft,
        profile,
        completedSteps,
        locale,
        revision,
      });
      setUnsaved(!result.ok);
    }, 350);
    return () => clearTimeout(timer);
  }, [state, ready]);
  const run = useCallback(
    async (
      text: string,
      mode: AnswerMode = "concise",
      retryTurnId?: string,
    ) => {
      if (active.current) return;
      const snapshot = stateRef.current,
        clean = text.trim();
      if (clean.length < 2 || clean.length > 4000) {
        setNotice("Please use between 2 and 4,000 characters.");
        return;
      }
      if (!retryTurnId && snapshot.messages.length >= 99) {
        setNotice(
          "Save or export this plan, then start a new conversation to keep it manageable.",
        );
        return;
      }
      const existing = retryTurnId
        ? snapshot.messages.find(
            (m) => m.role === "user" && m.turnId === retryTurnId,
          )
        : undefined;
      const turnId = existing?.turnId || crypto.randomUUID(),
        attemptId = crypto.randomUUID();
      const user: ChatMessage = existing || {
        id: crypto.randomUUID(),
        turnId,
        role: "user",
        content: clean,
        createdAt: Date.now(),
        status: "complete",
      };
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        turnId,
        attemptId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        status: "pending",
        streaming: true,
      };
      const controller = new AbortController(),
        current: Active = {
          controller,
          attemptId,
          conversationId: snapshot.id,
        };
      active.current = current;
      setNotice("");
      const effectiveMode = isRoadmapRequest(clean) ? "roadmap" : mode;
      const envelope: Omit<AdvisorRequest, "messages"> = {
        version: 1,
        conversationId: snapshot.id,
        turnId,
        attemptId,
        mode: effectiveMode,
        reasoning,
        profile: {
          ...snapshot.profile,
          ...(snapshot.locale === "bn" && !snapshot.profile.language
            ? { language: "bn" as const }
            : {}),
        },
      };
      let request: AdvisorRequest;
      try {
        const before = existing
          ? snapshot.messages.slice(
              0,
              snapshot.messages.findIndex((m) => m.id === existing.id),
            )
          : snapshot.messages;
        request = {
          ...envelope,
          messages: buildRequestHistory(before, user, envelope),
        };
      } catch (error) {
        active.current = null;
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to prepare this question.",
        );
        return;
      }
      apply({ type: "start", user, assistant, retry: !!existing });
      let pendingText = "",
        flushTimer: ReturnType<typeof setTimeout> | undefined,
        terminal = false;
      const flush = () => {
        clearTimeout(flushTimer);
        flushTimer = undefined;
        if (pendingText) {
          apply({
            type: "event",
            conversationId: snapshot.id,
            event: {
              type: "delta",
              requestId: "pending",
              attemptId,
              text: pendingText,
            },
          });
          pendingText = "";
        }
      };
      const consume = (event: ChatEvent) => {
        if (event.attemptId !== attemptId) return;
        if (event.type === "delta") {
          pendingText += event.text;
          if (!flushTimer) flushTimer = setTimeout(flush, 40);
          return;
        }
        if (event.type === "finish" || event.type === "error") {
          flush();
          terminal = true;
        }
        apply({ type: "event", conversationId: snapshot.id, event });
      };
      const timeout = setTimeout(
        () => controller.abort(new ChatError("provider_timeout", 504)),
        190000,
      );
      try {
        const response = await fetch("/api/advisor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            code?: keyof typeof ERROR_MESSAGES;
          };
          throw new ChatError(
            payload.code && payload.code in ERROR_MESSAGES
              ? payload.code
              : "provider_unavailable",
            response.status,
          );
        }
        if (response.status === 202) {
          const job = (await response.json()) as {
            jobId: string;
            requestId: string;
          };
          if (!/^[a-f0-9-]{36}$/.test(job.jobId))
            throw new ChatError("protocol_error", 502);
          current.jobId = job.jobId;
          let received = 0;
          while (!terminal) {
            if (controller.signal.aborted) throw controller.signal.reason;
            const progress = await fetch(`/api/advisor/jobs/${job.jobId}`, {
              signal: controller.signal,
              cache: "no-store",
            });
            if (!progress.ok) throw new ChatError("provider_unavailable", 502);
            const data = (await progress.json()) as {
              attemptId: string;
              status: string;
              phase: "thinking" | "typing";
              content: string;
              error?: string;
            };
            if (
              data.attemptId !== attemptId ||
              typeof data.content !== "string"
            )
              throw new ChatError("protocol_error", 502);
            consume({
              type: "progress",
              phase: data.phase === "typing" ? "typing" : "thinking",
              requestId: job.requestId,
              attemptId,
            });
            if (data.content.length > received) {
              consume({
                type: "delta",
                text: data.content.slice(received),
                requestId: job.requestId,
                attemptId,
              });
              received = data.content.length;
            }
            if (data.status === "complete" || data.status === "truncated")
              consume({
                type: "finish",
                reason: data.status === "truncated" ? "length" : "stop",
                requestId: job.requestId,
                attemptId,
              });
            else if (data.status === "interrupted" || data.status === "failed")
              consume({
                type: "error",
                code:
                  data.error && data.error in ERROR_MESSAGES
                    ? (data.error as keyof typeof ERROR_MESSAGES)
                    : "provider_unavailable",
                retryable: true,
                requestId: job.requestId,
                attemptId,
              });
            if (!terminal)
              await new Promise<void>((resolve, reject) => {
                const abort = () => {
                  clearTimeout(timer);
                  reject(controller.signal.reason);
                };
                const timer = setTimeout(() => {
                  controller.signal.removeEventListener("abort", abort);
                  resolve();
                }, 1000);
                controller.signal.addEventListener("abort", abort, {
                  once: true,
                });
              });
          }
        } else {
          if (!response.body) throw new ChatError("protocol_error", 502);
          for await (const frame of readSse(response.body, controller.signal)) {
            let event: ChatEvent;
            try {
              event = JSON.parse(frame.data);
            } catch {
              throw new ChatError("protocol_error", 502);
            }
            if (
              !event ||
              !["start", "progress", "delta", "finish", "error"].includes(
                event.type,
              )
            )
              throw new ChatError("protocol_error", 502);
            consume(event);
          }
        }
        flush();
        if (!terminal) throw new ChatError("protocol_error", 502);
      } catch (error) {
        flush();
        const code = controller.signal.aborted
          ? controller.signal.reason instanceof ChatError
            ? controller.signal.reason.code
            : "cancelled"
          : error instanceof ChatError
            ? error.code
            : "provider_unavailable";
        apply({
          type: "end",
          conversationId: snapshot.id,
          attemptId,
          status: "interrupted",
          error: ERROR_MESSAGES[code],
        });
      } finally {
        clearTimeout(timeout);
        clearTimeout(flushTimer);
        if (active.current === current) active.current = null;
      }
    },
    [apply, reasoning],
  );
  const restore = useCallback(
    (value: SavedConversation) => {
      stop();
      active.current = null;
      apply({ type: "replace", value });
      setNotice("");
    },
    [apply, stop],
  );
  const newConversation = useCallback(() => {
    undoRef.current = stateRef.current;
    setCanUndo(true);
    restore(createConversation(stateRef.current.locale));
  }, [restore]);
  const undo = useCallback(() => {
    if (undoRef.current) {
      const saved = undoRef.current;
      undoRef.current = null;
      setCanUndo(false);
      restore(saved);
    }
  }, [restore]);
  const retry = useCallback(
    async (turnId: string) => {
      const user = stateRef.current.messages.find(
        (m) => m.role === "user" && m.turnId === turnId,
      );
      if (user) await run(user.content, "concise", turnId);
    },
    [run],
  );
  const continueTurn = useCallback(
    async (turnId: string) => {
      const answer = stateRef.current.messages.find(
        (m) => m.role === "assistant" && m.turnId === turnId,
      );
      if (answer?.content)
        await run(
          `Continue this unfinished business answer without repeating it. Address the original goal; label any new assumptions. Previous partial answer:\n${answer.content.slice(-3000)}`,
          "detail",
        );
    },
    [run],
  );
  return {
    state,
    ready,
    notice,
    setNotice,
    unsaved,
    reasoning,
    setReasoning,
    send: run,
    retry,
    continueTurn,
    stop,
    newConversation,
    undo,
    restore,
    canUndo,
    apply,
  };
}
