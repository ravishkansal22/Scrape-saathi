import type { Field } from "./WorkflowForms";
export const num = (
  name: string,
  label: string,
  value = 0,
  min = 0,
): Field => ({ name, label, type: "number", value, min });
export const text = (name: string, label: string, value = ""): Field => ({
  name,
  label,
  value,
});
export const select = (
  name: string,
  label: string,
  options: { value: string; label: string }[],
): Field => ({ name, label, options });
