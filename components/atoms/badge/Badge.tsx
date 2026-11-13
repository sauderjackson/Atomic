import type { ReactNode } from "react";
import "./badge.css";

export type BadgeTone = "success" | "warning" | "error" | "info";

export type BadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone, children }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
