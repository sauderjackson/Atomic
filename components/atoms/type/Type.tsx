import type { ReactNode } from "react";
import "./type.css";

export type TypeKind = "display" | "title" | "body" | "label";

const tags = {
  display: "h1",
  title: "h2",
  body: "p",
  label: "p",
} as const;

export type TypeProps = {
  kind?: TypeKind;
  children: ReactNode;
};

export function Type({ kind = "body", children }: TypeProps) {
  const Tag = tags[kind];
  return <Tag className={`type type-${kind}`}>{children}</Tag>;
}
