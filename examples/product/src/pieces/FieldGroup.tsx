import type { ChangeEvent } from "react";
import { TextInput } from "@components/atoms/input/TextInput";
import { Type } from "@components/atoms/type/Type";

export type FieldGroupProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function FieldGroup({ label, name, value, onChange }: FieldGroupProps) {
  return (
    <div className="piece">
      <Type kind="label">Details</Type>
      <TextInput label={label} name={name} value={value} onChange={onChange} />
    </div>
  );
}
