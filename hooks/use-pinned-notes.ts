"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PinnedNote } from "@/types/advisor";
import {
  getStorage,
  PIN_KEY,
  readStorage,
  validateStoredNotes,
  writeStorage,
} from "@/lib/chat/storage";
export function usePinnedNotes(
  conversationId: string,
  onNotice: (text: string) => void,
) {
  const [pins, setPins] = useState<PinnedNote[]>([]),
    [ready, setReady] = useState(false),
    [removed, setRemoved] = useState<PinnedNote | null>(null),
    current = useRef<PinnedNote[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const notes = validateStoredNotes(
        readStorage(getStorage("localStorage"), PIN_KEY),
      );
      current.current = notes;
      setPins(notes);
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const publish = useCallback(
    (notes: PinnedNote[]) => {
      current.current = notes;
      setPins(notes);
      const result = writeStorage(getStorage("localStorage"), PIN_KEY, notes);
      if (!result.ok)
        onNotice(
          "Notes are kept for now, but could not be saved on this device. Export your plan to keep a copy.",
        );
      return result.ok;
    },
    [onNotice],
  );
  const add = useCallback(
    (
      text: string,
      sourceMessageId?: string,
      kind: PinnedNote["kind"] = "personal",
    ) => {
      const clean = text.trim();
      if (!ready || !clean) return;
      if (clean.length > 500) {
        onNotice("Choose a selection of 500 characters or less.");
        return;
      }
      if (
        current.current.some(
          (n) => n.text.toLowerCase() === clean.toLowerCase(),
        )
      ) {
        onNotice("This text is already pinned.");
        return;
      }
      if (current.current.length >= 60) {
        onNotice(
          "You have 60 saved notes. Export or remove a note before adding more.",
        );
        return;
      }
      if (
        publish([
          {
            id: crypto.randomUUID(),
            text: clean,
            createdAt: Date.now(),
            conversationId,
            sourceMessageId,
            kind,
          },
          ...current.current,
        ])
      )
        onNotice("Pinned to this plan.");
    },
    [ready, conversationId, onNotice, publish],
  );
  const update = useCallback(
    (id: string, text: string) => {
      const clean = text.trim();
      if (!clean || clean.length > 500) return;
      if (
        current.current.some(
          (n) => n.id !== id && n.text.toLowerCase() === clean.toLowerCase(),
        )
      ) {
        onNotice("Another note already contains this text.");
        return;
      }
      publish(
        current.current.map((n) => (n.id === id ? { ...n, text: clean } : n)),
      );
    },
    [publish, onNotice],
  );
  const remove = useCallback(
    (id: string) => {
      setRemoved(current.current.find((n) => n.id === id) || null);
      publish(current.current.filter((n) => n.id !== id));
    },
    [publish],
  );
  const undoRemove = useCallback(() => {
    if (removed) {
      publish([removed, ...current.current.filter((n) => n.id !== removed.id)]);
      setRemoved(null);
    }
  }, [removed, publish]);
  return { pins, ready, add, update, remove, removed, undoRemove };
}
