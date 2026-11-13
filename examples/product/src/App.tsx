import { useState, type ChangeEvent } from "react";
import { Button } from "@components/atoms/button/Button";
import { Type } from "@components/atoms/type/Type";
import "../../../tokens/build/themes.css";
import { FieldGroup } from "./pieces/FieldGroup";
import { NoteCard } from "./pieces/NoteCard";
import { PracticeBanner } from "./pieces/PracticeBanner";
import "./styles.css";

export function App() {
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");

  return (
    <div className="product" data-theme="neutral" data-mode="light">
      <main className="product-frame">
        <section className="screen" aria-label="Home">
          <PracticeBanner />
          <Type kind="display">Notes</Type>
          <NoteCard title="Welcome" body="This screen is built from the kit." />
          <FieldGroup label="Name" name="name" value={name} onChange={setText(setName)} />
          <div className="actions">
            <Button variant="primary">Save</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </section>
        <section className="screen" aria-label="Settings">
          <PracticeBanner />
          <Type kind="display">Settings</Type>
          <FieldGroup
            label="Workspace"
            name="workspace"
            value={workspace}
            onChange={setText(setWorkspace)}
          />
          <div className="actions">
            <Button variant="primary">Save</Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function setText(setValue: (value: string) => void) {
  return (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value);
}
