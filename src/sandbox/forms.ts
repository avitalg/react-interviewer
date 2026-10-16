/** Chrome does not fire `submit` in a frame without allow-forms. */
export function installFormSubmitShim(win: Window & typeof globalThis) {
  const submitEvent = (form: HTMLFormElement) => {
    const EventCtor = win.SubmitEvent ?? win.Event;
    form.dispatchEvent(new EventCtor("submit", { bubbles: true, cancelable: true }));
  };

  const isSubmitControl = (el: EventTarget | null): el is HTMLElement => {
    if (!el || !("tagName" in el)) return false;
    const node = el as HTMLElement;
    if (node.tagName === "BUTTON") return (node as HTMLButtonElement).type === "submit";
    if (node.tagName === "INPUT") {
      const type = (node as HTMLInputElement).type;
      return type === "submit" || type === "image";
    }
    return false;
  };

  try {
    win.HTMLFormElement.prototype.requestSubmit = function requestSubmit() {
      submitEvent(this);
    };
  } catch {
    // ignore
  }

  win.addEventListener(
    "click",
    (event) => {
      const el = event.target as HTMLElement | null;
      const control = el?.closest?.("button, input") ?? el;
      if (!isSubmitControl(control)) return;
      const form = (control as HTMLButtonElement).form ?? control.closest("form");
      if (!form) return;
      event.preventDefault();
      submitEvent(form);
    },
    true,
  );

  win.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" || event.repeat) return;
      const el = event.target as HTMLInputElement | null;
      if (!el || el.tagName !== "INPUT" || !el.form) return;
      event.preventDefault();
      submitEvent(el.form);
    },
    true,
  );
}
