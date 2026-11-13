import { useState, type ChangeEvent } from "react";
import { Badge } from "@components/atoms/badge/Badge";
import { Button } from "@components/atoms/button/Button";
import { Icon } from "@components/atoms/icon/Icon";
import { TextInput } from "@components/atoms/input/TextInput";
import { Type } from "@components/atoms/type/Type";
import "../../../tokens/build/themes.css";
import "../styles/gallery.css";

const themes = ["neutral", "harbor"] as const;
const modes = ["light", "dark"] as const;

type ThemeName = (typeof themes)[number];
type ModeName = (typeof modes)[number];

export default function Gallery() {
  return (
    <div className="gallery-list">
      {themes.flatMap((theme) => modes.map((mode) => <Stage key={`${theme}-${mode}`} mode={mode} theme={theme} />))}
    </div>
  );
}

function Stage({ theme, mode }: { theme: ThemeName; mode: ModeName }) {
  const [name, setName] = useState("");
  const label = `${theme === "neutral" ? "Neutral" : "Harbor"}, ${mode}`;
  return (
    <section className="gallery-stage" data-mode={mode} data-theme={theme}>
      <Type kind="title">{label}</Type>
      <Type kind="body">These pieces read tokens. The frame supplies the theme and the mode.</Type>
      <div className="gallery-row">
        <Button variant="primary">Continue</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
      <TextInput
        label="Name"
        value={name}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
      />
      <div className="gallery-row">
        <Badge tone="success">Ready</Badge>
        <Badge tone="warning">Check</Badge>
        <Badge tone="error">Blocked</Badge>
        <Badge tone="info">Note</Badge>
      </div>
      <div className="gallery-row">
        <Icon name="plus" />
        <Icon name="search" />
        <Icon name="check" />
        <Icon name="info" />
      </div>
    </section>
  );
}
