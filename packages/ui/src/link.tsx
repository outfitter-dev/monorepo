import type { ComponentType, ReactNode } from "react";

/**
 * Framework-primitive seam.
 *
 * Tier 1 components must not hard-import `next/link` — that would poison
 * portability (see the web-platform architecture doc, §5 "framework-primitive
 * seam"). Instead, link-rendering components accept an injectable
 * `LinkComponent` that defaults to a plain anchor. A Next app injects
 * `next/link`; a Bun/Hono app injects its own; a server-rendered surface gets
 * the anchor for free.
 *
 * This is the cheap day-one seam, NOT the full router-aware provider. Promote
 * to a context/provider only when a real second (non-Next) consumer needs it.
 */
export interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export type LinkComponent = ComponentType<LinkProps>;

export function DefaultLink({ href, className, children }: LinkProps) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export interface NavItemProps {
  href: string;
  children: ReactNode;
  className?: string;
  LinkComponent?: LinkComponent;
}

export function NavItem({
  href,
  children,
  className,
  LinkComponent = DefaultLink,
}: NavItemProps) {
  return (
    <LinkComponent href={href} className={className}>
      {children}
    </LinkComponent>
  );
}
