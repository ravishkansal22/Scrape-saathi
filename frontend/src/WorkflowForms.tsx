import { useId, useState } from "react";
import type { RecordData } from "./workflow";
export type Field = {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  options?: { value: string; label: string }[];
  optional?: boolean;
  min?: number;
};
export function Form({
  fields,
  submit,
  onSubmit,
  disabled = false,
}: {
  fields: Field[];
  submit: string;
  onSubmit: (v: RecordData) => void;
  disabled?: boolean;
}) {
  const formId = useId();
  return (
    <form
      className="wf-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        for (const f of fields) {
          if (f.type === "number")
            data[f.name] = Number(
              data[f.name],
            ) as unknown as FormDataEntryValue;
        }
        onSubmit(data);
      }}
    >
      {fields.map((f) => (
        <label key={f.name}>
          <span id={`${formId}-${f.name}`}>{f.label}</span>
          {f.options ? (
            <select
              aria-labelledby={`${formId}-${f.name}`}
              name={f.name}
              defaultValue={f.value}
              required={!f.optional}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              aria-labelledby={`${formId}-${f.name}`}
              name={f.name}
              defaultValue={f.value}
              required={!f.optional}
            />
          ) : (
            <input
              aria-labelledby={`${formId}-${f.name}`}
              name={f.name}
              type={f.type || "text"}
              min={f.min}
              step={f.type === "number" ? "any" : undefined}
              defaultValue={f.value}
              required={!f.optional}
            />
          )}
        </label>
      ))}
      <button disabled={disabled}>{submit}</button>
    </form>
  );
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="wf-badge">{children}</span>;
}
export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="wf-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Reveal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{title}</summary>
      {open && children}
    </details>
  );
}
