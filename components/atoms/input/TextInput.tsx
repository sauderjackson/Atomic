import { useId, type InputHTMLAttributes } from "react";
import "./input.css";

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function TextInput({ label, id, ...rest }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input id={inputId} className="field-input" type="text" {...rest} />
    </label>
  );
}
