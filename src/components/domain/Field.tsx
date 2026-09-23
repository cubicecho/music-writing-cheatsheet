import type { ReactNode } from 'react';
import { SectionHeading } from '@/components/section-heading';
import { cn } from '@/lib/utils';

/**
 * A control under an overline label — the shape every settings bar on the page wears.
 *
 * Not `@cubeui/field`: that is shadcn's form chrome, a `Label` with a description and an error
 * slot under it, for fields that can be wrong. Nothing here can be wrong — every control is a
 * choice out of a closed list — and what these bars want is the small uppercase overline the
 * rest of the page uses for the name of a group. So this is `SectionHeading` over a control, and
 * it lives in one file because two bars drawing it slightly differently is exactly how a key
 * picker and a song panel stop looking like one app.
 */
export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <SectionHeading variant="overline">{label}</SectionHeading>
      {children}
    </div>
  );
}
