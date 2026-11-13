import { iconSet, LucideGlyph, type IconName } from "../../../icons/lucide";
import "./icon.css";

export type { IconName };

export type IconProps = {
  name: IconName;
  iconSetId?: string;
};

export function Icon({ name, iconSetId = iconSet }: IconProps) {
  if (iconSetId !== iconSet) {
    throw new Error(`Icon set ${iconSetId} is not available. Use ${iconSet}.`);
  }
  return (
    <span className="icon">
      <LucideGlyph name={name} className="icon-glyph" />
    </span>
  );
}
