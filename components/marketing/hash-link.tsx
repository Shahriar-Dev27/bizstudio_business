"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

type HashLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { hash: string };

/**
 * In-page link to a section of the homepage.
 *
 * It stays a next/link to `/#hash` so Next stamps its own history state; a native fragment jump
 * leaves `history.state` null and Next ignores that entry on Back. But Next does nothing when the
 * URL already holds this hash (the user scrolled away since), so that one case is scrolled by hand.
 * scrollIntoView() keeps CSS scroll-margin-top and scroll-behavior, including the reduced-motion override.
 */
export function HashLink({ hash, onClick, ...props }: HashLinkProps): React.JSX.Element {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.location.pathname === "/" && window.location.hash === `#${hash}`) {
      const target = document.getElementById(hash);
      if (target) {
        event.preventDefault();
        target.scrollIntoView();
      }
    }
  }

  return <Link {...props} href={`/#${hash}`} onClick={handleClick} />;
}
