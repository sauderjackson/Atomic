import { Check, Info, Plus, Search, type LucideIcon } from "lucide-react";

export const iconSet = "lucide";

export type IconName = "plus" | "search" | "check" | "info";

const icons: Record<IconName, LucideIcon> = {
  plus: Plus,
  search: Search,
  check: Check,
  info: Info,
};

export function LucideGlyph({ name, className }: { name: IconName; className?: string }) {
  const Glyph = icons[name];
  return <Glyph className={className} aria-hidden="true" />;
}
