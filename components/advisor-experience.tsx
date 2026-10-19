"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FolderOpen,
  NotebookPen,
  RotateCcw,
  Save,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAdvisorChat } from "@/hooks/use-advisor-chat";
import { usePinnedNotes } from "@/hooks/use-pinned-notes";
import { strings } from "@/lib/chat/strings";
import { takeDraftHandoff } from "@/lib/chat/draft-handoff";
import { validateBusinessBrief } from "@/lib/chat/brief";
import { saveDevicePlan, downloadPlan } from "@/lib/chat/plan-library";
import { ChatComposer } from "./chat/chat-composer";
import { ChatTranscript } from "./chat/chat-transcript";
import { BusinessBriefEditor } from "./chat/business-brief";
import { PlanWorkspace } from "./chat/plan-workspace";
import { PlanLibrary } from "./chat/plan-library";
import { MarketingBrand } from "./marketing/marketing-brand";
import { PinnedNotes } from "./pinned-notes";
type Panel = "notes" | "brief" | "plans" | "tools" | null;
export function AdvisorExperience() {
  const chat = useAdvisorChat(),
    { state, apply, setNotice } = chat,
    t = strings(state.locale),
    router = useRouter(),
    search = useSearchParams();
  const notes = usePinnedNotes(state.id, setNotice),
    [panel, setPanel] = useState<Panel>(null),
    [allNotes, setAllNotes] = useState(false);
  const dialog = useRef<HTMLDivElement>(null),
    opener = useRef<HTMLElement | null>(null),
    handoffRead = useRef(false);
  const busy = state.phase !== "idle",
    currentNotes = useMemo(
      () =>
        notes.pins.filter(
          (n) => !n.conversationId || n.conversationId === state.id,
        ),
      [notes.pins, state.id],
    );
  const visibleNotes = allNotes ? notes.pins : currentNotes,
    pinnedTexts = useMemo(
      () => new Set(currentNotes.map((n) => n.text.toLowerCase())),
      [currentNotes],
    );
  const pin = notes.add;
  const toggleStep = useCallback(
    (key: string, done: boolean) => apply({ type: "steps", key, done }),
    [apply],
  );
  useEffect(() => {
    if (!chat.ready || handoffRead.current) return;
    handoffRead.current = true;
    const legacy = search.get("idea")?.slice(0, 500),
      draft = legacy || takeDraftHandoff();
    if (draft) {
      if (state.messages.length > 1) chat.newConversation();
      apply({ type: "draft", value: draft });
    }
    if (legacy) router.replace("/advisor", { scroll: false });
  }, [chat.ready, search, router, apply, chat, state.messages.length]);
  useEffect(() => {
    if (!panel) return;
    const target = dialog.current;
    if (!target) return;
    const focusInside = () => {
      if (!target.contains(document.activeElement))
        target.querySelector<HTMLButtonElement>('button:not([tabindex="-1"])')?.focus();
    };
    const timer = requestAnimationFrame(focusInside),
      observer = new MutationObserver(focusInside);
    observer.observe(target, { childList: true, subtree: true });
    document.addEventListener("focusin", focusInside);
    return () => {
      cancelAnimationFrame(timer);
      observer.disconnect();
      document.removeEventListener("focusin", focusInside);
      opener.current?.focus();
    };
  }, [panel]);
  function open(value: Panel, element?: HTMLElement) {
    opener.current = element || (document.activeElement as HTMLElement);
    setPanel(value);
  }
  function close() {
    setPanel(null);
  }
  function trap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]',
    );
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  function save() {
    const result = saveDevicePlan(state);
    if (result.ok && result.plan) {
      chat.restore(result.plan);
      setNotice(
        state.locale === "bn"
          ? "এই ডিভাইসে সংরক্ষিত হয়েছে।"
          : "Saved on this device.",
      );
    } else
      setNotice(
        result.reason === "conflict"
          ? "This plan was changed in another tab. Open the saved version before overwriting it."
          : result.reason === "limit"
            ? "The device library is full. Export and delete an older plan before saving."
            : "Unable to save on this device. Export the plan to keep a copy.",
      );
  }
  const notePanel = (
    <>
      <div className="adv-notes-scope">
        <button
          type="button"
          aria-pressed={!allNotes}
          onClick={() => setAllNotes(false)}
        >
          {t.currentNotes}
        </button>
        <button
          type="button"
          aria-pressed={allNotes}
          onClick={() => setAllNotes(true)}
        >
          {t.allNotes}
        </button>
      </div>
      <PinnedNotes
        notes={visibleNotes}
        onAdd={(text) => pin(text, undefined, "personal")}
        onUpdate={notes.update}
        onRemove={notes.remove}
        locale={state.locale}
      />
    </>
  );
  return (
    <div className="adv-shell" lang={state.locale}>
      <header className="adv-header" inert={panel ? true : undefined}>
        <div className="adv-header-bar">
          <div className="adv-header-brand">
            <MarketingBrand />
            <p className="mk-label adv-header-tag">
              {state.locale === "bn"
                ? "বাংলাদেশের ব্যবসার পরিকল্পনা"
                : "Bangladesh business advisor"}
            </p>
          </div>
          <div className="adv-header-actions">
            <button
              type="button"
              onClick={chat.newConversation}
              className="mk-button-secondary adv-header-button"
              aria-label={t.newPlan}
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span className="adv-collapse-label">{t.newPlan}</span>
            </button>
            <button
              type="button"
              onClick={(e) => open("notes", e.currentTarget)}
              className="mk-button-secondary adv-header-button adv-notes-toggle"
              aria-label={t.notes}
              aria-haspopup="dialog"
            >
              <NotebookPen size={18} aria-hidden="true" />
              <span className="adv-collapse-label">{t.notes}</span>
              {currentNotes.length > 0 && (
                <span className="adv-count">{currentNotes.length}</span>
              )}
            </button>
            <Link
              href="/"
              className="mk-button-secondary adv-header-button"
              aria-label={t.home}
            >
              <ArrowLeft size={18} aria-hidden="true" />
              <span className="adv-collapse-label">{t.home}</span>
            </Link>
          </div>
        </div>
      </header>
      <div className="adv-body" inert={panel ? true : undefined}>
        <main className="adv-chat">
          <h1 className="mk-sr-only">BizGuide AI business advisor</h1>
          <ChatTranscript
            state={state}
            onPin={pin}
            pinnedTexts={pinnedTexts}
            onToggleStep={toggleStep}
            onRetry={(turn) => void chat.retry(turn)}
            onContinue={(turn) => void chat.continueTurn(turn)}
            onStarter={(text) => void chat.send(text)}
          />
          <p className="mk-sr-only" role="status">
            {busy ? (state.phase === "typing" ? t.typing : t.thinking) : ""}
          </p>
          <div className="adv-composer-bar">
            <div className="adv-composer-inner">
              <div className="adv-workspace-bar">
                <div className="adv-workspace-actions">
                  <button
                    type="button"
                    onClick={(e) => open("brief", e.currentTarget)}
                    aria-label={t.brief}
                    title={t.brief}
                  >
                    <SlidersHorizontal size={18} aria-hidden="true" />
                    <span>{t.brief}</span>
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy || !chat.ready}
                    aria-label={t.save}
                    title={t.save}
                  >
                    <Save size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => open("plans", e.currentTarget)}
                    aria-label={t.library}
                    title={t.library}
                  >
                    <FolderOpen size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPlan(state, notes.pins)}
                    aria-label={t.export}
                    title={t.export}
                  >
                    <Download size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => open("tools", e.currentTarget)}
                    aria-label={t.tools}
                    title={t.tools}
                  >
                    <NotebookPen size={18} aria-hidden="true" />
                  </button>
                </div>
                <label>
                  <span className="mk-sr-only">Interface language</span>
                  <select
                    aria-label="Interface language"
                    value={state.locale}
                    onChange={(e) =>
                      apply({
                        type: "locale",
                        value: e.target.value === "bn" ? "bn" : "en",
                      })
                    }
                  >
                    <option value="en">EN</option>
                    <option value="bn">বাংলা</option>
                  </select>
                </label>
              </div>
              {(state.error || chat.notice || chat.unsaved) && (
                <div
                  className="adv-alert"
                  role={state.error ? "alert" : "status"}
                >
                  <TriangleAlert size={17} aria-hidden="true" />
                  <p>{state.error || chat.notice || t.unsaved}</p>
                  {chat.notice && !state.error && (
                    <button
                      type="button"
                      className="adv-note-action"
                      aria-label={t.close}
                      onClick={() => setNotice("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
              {chat.canUndo && (
                <button
                  type="button"
                  className="adv-inline-action"
                  onClick={chat.undo}
                >
                  {t.undo}
                </button>
              )}
              {notes.removed && (
                <button
                  type="button"
                  className="adv-inline-action"
                  onClick={notes.undoRemove}
                >
                  {state.locale === "bn"
                    ? "মুছে ফেলা নোট ফেরান"
                    : "Undo note deletion"}
                </button>
              )}
              {!chat.ready ? (
                <p role="status">{t.waiting}</p>
              ) : (
                <ChatComposer
                  value={state.draft}
                  onChange={(value) => apply({ type: "draft", value })}
                  onSend={(text, mode) => void chat.send(text, mode)}
                  onStop={chat.stop}
                  busy={busy}
                  reasoning={chat.reasoning}
                  onReasoning={chat.setReasoning}
                  locale={state.locale}
                />
              )}
              <p className="adv-disclaimer">{t.disclaimer}</p>
            </div>
          </div>
        </main>
        <div className="adv-sidebar">{notePanel}</div>
      </div>
      {panel && (
        <div
          ref={dialog}
          className="adv-drawer adv-workspace-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={
            panel === "notes"
              ? t.pinned
              : panel === "plans"
                ? t.library
                : panel === "brief"
                  ? t.brief
                  : t.tools
          }
          onKeyDown={trap}
        >
          <button
            type="button"
            className="adv-drawer-scrim"
            aria-hidden="true"
            aria-label={t.close}
            tabIndex={-1}
            onClick={close}
          />
          <div className="adv-drawer-panel">
            <div className="adv-panel-toolbar">
              <div>
                {panel !== "notes" && (
                  <>
                    <button
                      type="button"
                      aria-pressed={panel === "brief"}
                      onClick={() => setPanel("brief")}
                    >
                      {t.brief}
                    </button>
                    <button
                      type="button"
                      aria-pressed={panel === "plans"}
                      onClick={() => setPanel("plans")}
                    >
                      {t.library}
                    </button>
                    <button
                      type="button"
                      aria-pressed={panel === "tools"}
                      onClick={() => setPanel("tools")}
                    >
                      {t.tools}
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                className="mk-icon-button"
                aria-label={t.close}
                onClick={close}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {panel === "notes" ? (
              notePanel
            ) : (
              <div className="adv-panel-content">
                {panel === "brief" ? (
                  <BusinessBriefEditor
                    profile={state.profile}
                    disabled={busy}
                    locale={state.locale}
                    onChange={(profile) => {
                      try {
                        apply({
                          type: "profile",
                          value: validateBusinessBrief(profile),
                        });
                      } catch {
                        setNotice(
                          "Please enter a valid budget and concise business details.",
                        );
                      }
                    }}
                  />
                ) : panel === "plans" ? (
                  <PlanLibrary
                    locale={state.locale}
                    onNotice={setNotice}
                    onOpen={(plan) => {
                      chat.restore(plan);
                      close();
                    }}
                  />
                ) : (
                  <PlanWorkspace
                    locale={state.locale}
                    notes={currentNotes}
                    completed={state.completedSteps}
                    onToggle={toggleStep}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
