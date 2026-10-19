import { useEffect } from "react";
import type { RefObject } from "react";
import { PROCESS_STAGES } from "./process-content";

/**
 * Client-only enhancement for the "How it works" walkthrough.
 *
 * Ownership (nothing is ever animated by both libraries):
 * - React: `activeStage` and every `data-state` attribute. Nothing in this file writes `data-state`.
 * - GSAP + ScrollTrigger: stage detection, `[data-process-path]` stroke-dasharray, the
 *   `--mk-arrow` custom property on each path's `.mk-conn` wrapper, and the transform of each
 *   `[data-process-node]` wrapper.
 * - Anime.js: opacity/transform of `[data-process-detail]` and `[data-process-note]`, which are
 *   descendants of the node wrappers and never contain a GSAP-owned path.
 * - This hook: the `data-motion="live"` attribute on the root, set only while enhancement is running.
 *
 * Native scrolling only: no wheel handlers, no scroll snapping, no pinning.
 */

/**
 * SINGLE SOURCE OF TRUTH, mirrored literally in app/marketing.css: the `@media` condition above the
 * `.mk-process-visual { position: sticky }` rule must be this exact string (whitespace aside).
 * Edit both together. Range syntax with an exclusive upper bound leaves no gap or overlap at
 * 1199/1200 (including fractional widths).
 *
 * It is the spec's "width >= 1024 and height >= 720 with reduced motion off", except that the
 * 1024-1199px band needs 768px of height because the diagram is up to ~680px tall there (measured).
 */
export const PROCESS_MOTION_QUERY =
  "(width >= 1200px) and (height >= 720px) and (prefers-reduced-motion: no-preference), " +
  "(width >= 1024px) and (width < 1200px) and (height >= 768px) and (prefers-reduced-motion: no-preference)";

const LAST_STAGE = PROCESS_STAGES.length - 1;
/** Scroll counts as settled after this many consecutive animation frames with an unchanged scrollY. */
const SETTLE_FRAMES = 3;
/** Same, while a #hash target exists that the browser has not scrolled to yet (smooth scroll may not have started). */
const SETTLE_FRAMES_PENDING_ANCHOR = 20;
/** Never wait for a scroll to settle longer than this. */
const SETTLE_CAP_MS = 4000;
/** All detail reveals together (stagger included) stay within roughly this window. */
const REVEAL_WINDOW_MS = 210;
const REVEAL_DURATION_MS = 240;
const REVEAL_MAX_STAGGER_MS = 40;
/** Stage connectors finish when the stage top reaches this many px from the viewport top (anchors land it at 88px). */
const ANCHOR_END_TOP = 140;
/** A stage becomes active when its section top crosses this fraction of the viewport height. */
const STAGE_LINE = 0.5;
const BIG_GAP = 10000;
const STEP_SELECTOR = "[data-process-step]";
const PATH_SELECTOR = "[data-process-path]";
const NODE_SELECTOR = "[data-process-node]";
const DETAIL_SELECTOR = "[data-process-detail]";
const NOTE_SELECTOR = "[data-process-note]";

type Cleanup = () => void;
type GsapModule = typeof import("gsap");
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger");
type AnimeModules = {
  animation: typeof import("animejs/animation");
  scope: typeof import("animejs/scope");
  utils: typeof import("animejs/utils");
};

export function useProcessMotion(rootRef: RefObject<HTMLElement | null>, onStageChange: (stage: number) => void): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const query = window.matchMedia(PROCESS_MOTION_QUERY);
    let stopMode: Cleanup | null = null;

    // Re-evaluated whenever viewport size or reduced-motion preference changes while the page is open.
    const applyMode = () => {
      stopMode?.();
      stopMode = query.matches ? startEnhanced(root, onStageChange) : startStatic(onStageChange);
    };

    query.addEventListener("change", applyMode);
    applyMode();

    return () => {
      query.removeEventListener("change", applyMode);
      stopMode?.();
      stopMode = null;
    };
  }, [rootRef, onStageChange]);
}

/** Normal-flow modes (small, short, or reduced motion): no motion at all, finished diagram. */
function startStatic(report: (stage: number) => void): Cleanup {
  report(LAST_STAGE);
  return () => {};
}

function startEnhanced(root: HTMLElement, report: (stage: number) => void): Cleanup {
  let disposed = false;
  let teardownLibraries: Cleanup | null = null;

  const steps = Array.from(root.querySelectorAll<HTMLElement>(STEP_SELECTOR));
  let reported = -1;
  let onReported: ((stage: number) => void) | null = null;

  const setStage = (stage: number) => {
    if (stage === reported) return;
    reported = stage;
    report(stage);
    onReported?.(stage);
  };

  /** Pure geometry version of the ScrollTrigger rule, used for the first paint and after refreshes. */
  const stageFromGeometry = (): number => {
    const line = window.innerHeight * STAGE_LINE;
    let stage = 0;
    steps.forEach((step, index) => {
      if (step.getBoundingClientRect().top <= line) stage = index;
    });
    return stage;
  };

  // Correct for a direct load at any #process-* anchor before any library arrives.
  setStage(stageFromGeometry());

  const bridge: Bridge = {
    setStage,
    stageFromGeometry,
    currentStage: () => reported,
    subscribe: (listener) => {
      onReported = listener;
    },
  };

  // Animation code is unavailable or failed to start: fall back to the readable finished diagram.
  const fallBack = () => {
    if (disposed) return;
    teardownLibraries?.();
    teardownLibraries = null;
    onReported = null;
    reported = LAST_STAGE;
    report(LAST_STAGE);
  };

  const begin = (gsapModule: GsapModule, scrollTriggerModule: ScrollTriggerModule, anime: AnimeModules | null) => {
    try {
      teardownLibraries = enhance(root, steps, gsapModule, scrollTriggerModule, anime, bridge);
    } catch {
      fallBack();
    }
  };

  let cancelWait: Cleanup | null = null;

  Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    Promise.all([import("animejs/animation"), import("animejs/scope"), import("animejs/utils")])
      .then(([animation, scope, utils]): AnimeModules => ({ animation, scope, utils }))
      .catch(() => null),
  ])
    .then(([gsapModule, scrollTriggerModule, anime]) => {
      if (disposed) return; // unmounted, or the mode changed, while the code was loading
      const { ScrollTrigger } = scrollTriggerModule;
      gsapModule.gsap.registerPlugin(ScrollTrigger); // the only registration; `enhance` relies on it
      // "load" is dropped from ScrollTrigger's automatic refresh events: that refresh can fire in the
      // middle of the browser's smooth anchor scroll. Fonts and layout changes are refreshed below
      // through scroll-settled refreshes instead.
      ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
      // A native smooth scroll (anchor jump on load, a step link) may still be travelling.
      // ScrollTrigger measures by resetting the scroll position, which would cancel it, so wait
      // until scrollY has demonstrably stopped moving (independent of ScrollTrigger's own tracking).
      cancelWait = whenScrollSettled(
        () => {
          cancelWait = null;
          if (!disposed) begin(gsapModule, scrollTriggerModule, anime);
        },
        // The diagram follows the real position meanwhile (scroll restoration after back navigation).
        () => setStage(stageFromGeometry()),
      );
    })
    .catch(fallBack);

  return () => {
    disposed = true;
    onReported = null;
    cancelWait?.();
    teardownLibraries?.();
    teardownLibraries = null;
  };
}

type Bridge = {
  setStage: (stage: number) => void;
  stageFromGeometry: () => number;
  currentStage: () => number;
  subscribe: (listener: (stage: number) => void) => void;
};

function enhance(
  root: HTMLElement,
  steps: HTMLElement[],
  gsapModule: GsapModule,
  scrollTriggerModule: ScrollTriggerModule,
  anime: AnimeModules | null,
  bridge: Bridge,
): Cleanup {
  const { gsap } = gsapModule;
  const { ScrollTrigger } = scrollTriggerModule; // already registered by the caller

  const cleanups: Cleanup[] = [];
  let finished = false;
  const dispose = () => {
    if (finished) return;
    finished = true;
    root.removeAttribute("data-motion");
    // Reverse order: observers and listeners first, then the animation instances.
    for (let i = cleanups.length - 1; i >= 0; i--) {
      try {
        cleanups[i]();
      } catch {
        // keep disposing the remaining instances
      }
    }
  };

  try {
    // Set first: it changes layout (stage state labels appear), and everything below measures it.
    root.setAttribute("data-motion", "live");

    // ---------- Anime.js: decorative detail and note arrivals (distinct child elements) ----------
    if (anime) {
      const details = createDetailMotion(root, anime);
      cleanups.push(details.dispose);
      details.apply(bridge.currentStage(), false);
      bridge.subscribe((stage) => details.apply(stage, true));
    }

    // ---------- GSAP: stage detection, connector drawing, node arrival ----------
    const context = gsap.context(() => {
      const pathsByStage = new Map<number, SVGPathElement[]>();
      root.querySelectorAll<SVGPathElement>(PATH_SELECTOR).forEach((path) => {
        const stage = Number(path.dataset.processStage);
        if (Number.isNaN(stage)) return;
        pathsByStage.set(stage, [...(pathsByStage.get(stage) ?? []), path]);
      });
      const nodesByStage = new Map<number, HTMLElement[]>();
      root.querySelectorAll<HTMLElement>(NODE_SELECTOR).forEach((node) => {
        const stage = Number(node.dataset.processStage);
        if (Number.isNaN(stage)) return;
        nodesByStage.set(stage, [...(nodesByStage.get(stage) ?? []), node]);
      });

      steps.forEach((step, index) => {
        // 1. Stage boundaries. Consecutive ranges share an edge so there is never a gap, and the
        //    first/last ranges are open-ended: scrolling back above or past the section keeps the
        //    nearest stage instead of leaving stale state.
        const next = steps[index + 1];
        ScrollTrigger.create({
          trigger: step,
          start: index === 0 ? "top bottom" : `top ${STAGE_LINE * 100}%`,
          endTrigger: next,
          end: next ? `top ${STAGE_LINE * 100}%` : "max",
          onToggle: (self) => {
            if (self.isActive) bridge.setStage(index);
          },
        });

        // 2. Connectors drawn while the stage is read. Scrubbed, so reverse scrolling un-draws them.
        //    They finish when the stage top reaches ANCHOR_END_TOP px (below where an anchor jump
        //    lands it: header clearance 88px), so landing on any stage anchor shows its connectors
        //    complete at every viewport height. That is always well before the next stage's boundary.
        const paths = pathsByStage.get(index);
        if (paths && paths.length > 0) {
          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: step, start: "top 55%", end: `top ${ANCHOR_END_TOP}px`, scrub: true, invalidateOnRefresh: true },
          });
          const each = paths.length === 1 ? 1 : Math.max(1 / paths.length, 0.4);
          paths.forEach((path, i) => {
            const at = paths.length === 1 ? 0 : (i * (1 - each)) / (paths.length - 1);
            // A zero-length square-capped dash would still paint a dot, so the path fades in with its first pixels.
            timeline.fromTo(path, { opacity: 0 }, { opacity: 1, duration: Math.min(0.03, each) }, at);
            timeline.fromTo(
              path,
              { strokeDasharray: `0 ${BIG_GAP}` },
              { strokeDasharray: () => `${renderedLength(path)} ${BIG_GAP}`, duration: each },
              at,
            );
            const wrapper = path.closest<HTMLElement>(".mk-conn");
            if (wrapper) {
              // The CSS arrowhead appears as its connector completes.
              timeline.fromTo(wrapper, { "--mk-arrow": 0 }, { "--mk-arrow": 1, duration: Math.min(0.1, each) }, at + each - Math.min(0.1, each));
            }
          });
        }

        // 3. Node arrival: a short scrubbed slide into place just before the stage becomes active.
        const nodes = nodesByStage.get(index);
        if (nodes && nodes.length > 0) {
          gsap.fromTo(
            nodes,
            { y: 16, scale: 0.97 },
            {
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: step, start: "top 85%", end: `top ${STAGE_LINE * 100}%`, scrub: true },
            },
          );
        }
      });
    }, root);
    cleanups.push(() => context.revert());

    // ---------- Geometry refresh: fonts, layout changes, ScrollTrigger's own refreshes ----------
    const resync = () => bridge.setStage(bridge.stageFromGeometry());
    ScrollTrigger.addEventListener("refresh", resync);
    cleanups.push(() => ScrollTrigger.removeEventListener("refresh", resync));

    // Refreshes wait until scrolling has settled so they never cancel a smooth scroll in flight, and
    // coalesce while one is pending.
    let cancelRefresh: Cleanup | null = null;
    const refreshWhenSettled = () => {
      if (finished || cancelRefresh) return;
      cancelRefresh = whenScrollSettled(() => {
        cancelRefresh = null;
        if (!finished) ScrollTrigger.refresh();
      });
    };
    cleanups.push(() => {
      cancelRefresh?.();
      cancelRefresh = null;
    });

    if (document.fonts?.ready) {
      void document.fonts.ready.then(refreshWhenSettled);
    }

    const layout = root.querySelector(".mk-process-layout") ?? root;
    let primed = false;
    const observer = new ResizeObserver(() => {
      if (!primed) {
        primed = true; // the initial notification is not a change (data-motion was set before measuring)
        return;
      }
      refreshWhenSettled();
    });
    observer.observe(layout);
    cleanups.push(() => observer.disconnect());

    bridge.setStage(bridge.stageFromGeometry());
  } catch (error) {
    dispose();
    throw error;
  }

  return dispose;
}

/**
 * Calls `callback` once scrolling has stopped: window.scrollY unchanged for several consecutive
 * animation frames (longer while a #hash target has not been reached yet, because a smooth anchor
 * scroll may not have started). Does not depend on any library having observed a scroll event.
 * `onFrame` (optional) runs once per frame while waiting, e.g. to keep a stage indicator current
 * during the browser's own scroll restoration. Gives up waiting after SETTLE_CAP_MS. The returned
 * function cancels everything (idempotent).
 */
function whenScrollSettled(callback: () => void, onFrame?: () => void): Cleanup {
  let done = false;
  let frame = 0;
  let timeout = 0;
  let last = window.scrollY;
  let stable = 0;

  const cancel = () => {
    done = true;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
  };
  const finish = () => {
    if (done) return;
    cancel();
    callback();
  };
  const tick = () => {
    if (done) return;
    onFrame?.();
    const y = window.scrollY;
    if (y === last) stable += 1;
    else {
      last = y;
      stable = 0;
    }
    if (stable >= (anchorPending() ? SETTLE_FRAMES_PENDING_ANCHOR : SETTLE_FRAMES)) finish();
    else frame = window.requestAnimationFrame(tick);
  };

  frame = window.requestAnimationFrame(tick);
  timeout = window.setTimeout(finish, SETTLE_CAP_MS);
  return cancel;
}

/** True while the URL hash names an element that the page has not scrolled to yet. */
function anchorPending(): boolean {
  if (!window.location.hash) return false;
  let id = window.location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // keep the raw id
  }
  const target = document.getElementById(id);
  if (!target) return false;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
  return !atEnd && Math.abs(target.getBoundingClientRect().top - margin) > 2;
}

/** Rendered (screen-space) length of an orthogonal connector. Strokes use non-scaling-stroke, so dashes are in pixels. */
function renderedLength(path: SVGPathElement): number {
  const box = path.getBoundingClientRect();
  return Math.ceil(box.width + box.height) + 2;
}

type DetailItem = { el: HTMLElement; stage: number; kind: "detail" | "note"; shown: boolean };

function createDetailMotion(root: HTMLElement, anime: AnimeModules): { apply: (stage: number, animated: boolean) => void; dispose: Cleanup } {
  const { animate } = anime.animation;
  const { createScope } = anime.scope;
  const { set, stagger } = anime.utils;

  const items: DetailItem[] = [];
  const collect = (selector: string, kind: DetailItem["kind"]) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const stage = Number(el.closest<HTMLElement>(NODE_SELECTOR)?.dataset.processStage);
      if (!Number.isNaN(stage)) items.push({ el, stage, kind, shown: true });
    });
  };
  collect(DETAIL_SELECTOR, "detail");
  collect(NOTE_SELECTOR, "note");

  const scope = createScope({ root });
  let disposed = false;

  return {
    apply(stage, animated) {
      if (disposed) return;
      const show: DetailItem[] = [];
      const hide: DetailItem[] = [];
      for (const item of items) {
        const wanted = item.stage <= stage;
        if (wanted === item.shown) continue;
        item.shown = wanted;
        (wanted ? show : hide).push(item);
      }
      const els = (list: DetailItem[], kind?: DetailItem["kind"]) =>
        list.filter((item) => !kind || item.kind === kind).map((item) => item.el);

      scope.execute(() => {
        if (!animated) {
          if (hide.length) set(els(hide), { opacity: 0 });
          if (show.length) set(els(show), { opacity: 1, translateY: 0 });
          return;
        }
        if (hide.length) animate(els(hide), { opacity: 0, duration: 180, ease: "outQuad" });
        const details = els(show, "detail");
        if (details.length) {
          // Cap the whole reveal (stagger included) at ~450ms even when a jump reveals many details.
          const step = Math.min(REVEAL_MAX_STAGGER_MS, REVEAL_WINDOW_MS / Math.max(1, details.length - 1));
          animate(details, { opacity: [0, 1], translateY: [8, 0], duration: REVEAL_DURATION_MS, ease: "outQuad", delay: stagger(step) });
        }
        const notes = els(show, "note");
        if (notes.length) {
          // The pinned sample note settles into its card; well inside the 500ms budget.
          animate(notes, { opacity: [0, 1], translateY: [-24, 0], duration: 450, ease: "outCubic" });
        }
      });
    },
    dispose() {
      disposed = true;
      scope.revert();
      // Belt and braces: leave no inline motion styles behind on the elements this scope owned.
      for (const { el } of items) {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
        el.style.removeProperty("will-change");
        if (!el.getAttribute("style")) el.removeAttribute("style");
      }
    },
  };
}
