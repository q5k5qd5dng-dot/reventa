import { $$, shake } from "./util";

export const setErr = (input: HTMLInputElement, msg: string) => {
  const f = input.closest(".field")!;
  f.classList.toggle("err", !!msg);
  const m = f.querySelector(".msg") as HTMLElement | null;
  if (m) m.textContent = msg;
  if (msg) shake(f as HTMLElement);
  return !msg;
};
export const clearErr = (form: HTMLElement) =>
  $$(".field.err", form).forEach((f) => {
    f.classList.remove("err");
    const m = f.querySelector(".msg") as HTMLElement | null;
    if (m) m.textContent = "";
  });
