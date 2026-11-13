import { useState, type ChangeEvent } from "react";
import { Badge } from "@components/atoms/badge/Badge";
import { Button } from "@components/atoms/button/Button";
import { Icon } from "@components/atoms/icon/Icon";
import { TextInput } from "@components/atoms/input/TextInput";
import { Type } from "@components/atoms/type/Type";
import "../../tokens/build/themes.css";
import "./styles.css";

const themes = ["neutral", "harbor"] as const;
const modes = ["light", "dark"] as const;

type ThemeName = (typeof themes)[number];
type ModeName = (typeof modes)[number];

export function App() {
  const [theme, setTheme] = useState<ThemeName>("neutral");
  const [mode, setMode] = useState<ModeName>("light");
  const [name, setName] = useState("");

  return (
    <div className="catalog" data-theme={theme} data-mode={mode}>
      <main className="catalog-frame">
        <header className="catalog-bar">
          <div>
            <Type kind="display">Atomic</Type>
            <Type kind="label">Atoms use semantic tokens. Swap the theme or the mode.</Type>
          </div>
          <div className="catalog-controls">
            <div className="choice-group" role="group" aria-label="Theme">
              {themes.map((item) => (
                <span className="choice" data-selected={theme === item} key={item}>
                  <Button
                    variant="secondary"
                    aria-pressed={theme === item}
                    onClick={() => setTheme(item)}
                  >
                    {item === "neutral" ? "Neutral" : "Harbor"}
                  </Button>
                </span>
              ))}
            </div>
            <div className="choice-group" role="group" aria-label="Mode">
              {modes.map((item) => (
                <span className="choice" data-selected={mode === item} key={item}>
                  <Button
                    variant="secondary"
                    aria-pressed={mode === item}
                    onClick={() => setMode(item)}
                  >
                    {item === "light" ? "Light" : "Dark"}
                  </Button>
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="specimen">
          <Type kind="title">Type</Type>
          <Type kind="body">
            This sentence uses the body style. The theme file changes the font. The component does not.
          </Type>
          <Type kind="label">Label style for captions.</Type>
        </section>

        <section className="specimen">
          <Type kind="title">Actions</Type>
          <div className="specimen-row">
            <Button variant="primary">Continue</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </section>

        <section className="specimen">
          <Type kind="title">Field</Type>
          <TextInput
            label="Name"
            name="name"
            value={name}
            placeholder="Ada"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          />
        </section>

        <section className="specimen">
          <Type kind="title">Status</Type>
          <div className="specimen-row">
            <Badge tone="success">Ready</Badge>
            <Badge tone="warning">Check</Badge>
            <Badge tone="error">Blocked</Badge>
            <Badge tone="info">Note</Badge>
          </div>
        </section>

        <section className="specimen">
          <Type kind="title">Icons</Type>
          <div className="specimen-row">
            <Icon name="plus" />
            <Icon name="search" />
            <Icon name="check" />
            <Icon name="info" />
          </div>
        </section>
      </main>
    </div>
  );
}
