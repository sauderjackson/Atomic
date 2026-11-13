import { Badge } from "@components/atoms/badge/Badge";
import { Type } from "@components/atoms/type/Type";

export type NoteCardProps = {
  title: string;
  body: string;
};

export function NoteCard({ title, body }: NoteCardProps) {
  return (
    <article className="piece">
      <Type kind="title">{title}</Type>
      <Type kind="body">{body}</Type>
      <Badge tone="info">Note</Badge>
    </article>
  );
}
