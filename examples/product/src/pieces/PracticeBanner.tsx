import { Icon } from "@components/atoms/icon/Icon";
import { Type } from "@components/atoms/type/Type";

export function PracticeBanner() {
  return (
    <div className="piece piece-row">
      <Icon name="info" />
      <Type kind="label">Practice app. This banner stays with the product.</Type>
    </div>
  );
}
