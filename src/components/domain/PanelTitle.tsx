import type { ReactNode } from 'react';

/**
 * A card's title with what it is read in beside it, muted: "Pop-punk · in C major".
 *
 * Part of the heading rather than the description, because the key is part of what the card is
 * called — the same progression in another key is another card — and because a card's
 * description is already the sentence about it. Said once so the six panels that carry a key or a
 * meter draw it the same way.
 */
export function PanelTitle({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <>
      {title}
      {meta ? <span className="ms-2 font-normal text-muted-foreground text-sm">{meta}</span> : null}
    </>
  );
}
