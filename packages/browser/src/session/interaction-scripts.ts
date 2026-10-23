const MAX_FORMS = 5;
const MAX_FIELDS = 20;
const MAX_CLICK_TARGETS = 10;
const MAX_TEXT_LINES = 400;
const MAX_LINE_CHARS = 200;

const SHARED_HELPERS = `
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };
  const clean = (text) => (text || "").replace(/\\s+/g, " ").trim().slice(0, ${MAX_LINE_CHARS});
  const labelOf = (el) => {
    const fromLabels = el.labels && el.labels[0] ? el.labels[0].textContent : "";
    return clean(el.getAttribute("aria-label") || fromLabels || el.getAttribute("placeholder") || el.getAttribute("name") || el.id || el.tagName.toLowerCase());
  };
`;

export const LIST_FORMS_SCRIPT = `(() => {
  ${SHARED_HELPERS}
  const kindOf = (el) => {
    if (el.tagName === "TEXTAREA") return "textarea";
    if (el.tagName === "SELECT") return "select";
    const type = (el.getAttribute("type") || "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) return null;
    if (["email", "password", "tel", "number", "url", "date", "checkbox", "radio", "file"].includes(type)) return type;
    return "text";
  };
  const numberAttr = (el, name) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : null;
  };
  const forms = [...document.forms].filter(isVisible).slice(0, ${MAX_FORMS});
  return forms.map((form, formIndex) => {
    form.setAttribute("data-aw-form", String(formIndex));
    const seenRadios = new Set();
    const fields = [...form.querySelectorAll("input, select, textarea")]
      .filter((el) => kindOf(el) && isVisible(el) && !el.disabled && !el.readOnly)
      .filter((el) => {
        if (kindOf(el) !== "radio") return true;
        if (seenRadios.has(el.name)) return false;
        seenRadios.add(el.name);
        return true;
      })
      .slice(0, ${MAX_FIELDS})
      .map((el, index) => {
        el.setAttribute("data-aw-field", String(index));
        return {
          index,
          kind: kindOf(el),
          name: el.getAttribute("name") || "",
          label: labelOf(el),
          required: el.required === true,
          min: numberAttr(el, "min"),
          max: numberAttr(el, "max"),
        };
      });
    const heading = form.querySelector("h1, h2, h3, legend");
    return {
      index: formIndex,
      label: clean(form.getAttribute("aria-label") || (heading && heading.textContent) || form.getAttribute("name") || form.id || "form " + (formIndex + 1)),
      fields,
      hasSubmit: Boolean(form.querySelector('button[type="submit"], input[type="submit"], button:not([type])')),
    };
  });
})()`;

export const LIST_CLICK_TARGETS_SCRIPT = `(() => {
  ${SHARED_HELPERS}
  const nameOf = (el) => clean(el.getAttribute("aria-label") || el.textContent || el.getAttribute("title"));
  const isPlainButton = (el) => el.tagName === "BUTTON" ? (el.type === "button" || !el.form) : el.getAttribute("role") === "button";
  return [...document.querySelectorAll("button, [role=button]")]
    .filter((el) => isPlainButton(el) && !el.disabled && isVisible(el) && nameOf(el))
    .slice(0, ${MAX_CLICK_TARGETS})
    .map((el, index) => {
      el.setAttribute("data-aw-click", String(index));
      return { index, name: nameOf(el) };
    });
})()`;

export const CAPTURE_STATE_SCRIPT = `(() => {
  const clean = (text) => (text || "").replace(/\\s+/g, " ").trim().slice(0, ${MAX_LINE_CHARS});
  const lines = (document.body.innerText || "").split("\\n").map(clean).filter(Boolean).slice(0, ${MAX_TEXT_LINES});
  const dialog = Boolean(document.querySelector('[role="dialog"], [role="alertdialog"], dialog[open]'));
  return { lines, dialog };
})()`;

export function invalidFieldsScript(formIndex: number): string {
  return `(() => {
  const form = document.querySelector('[data-aw-form="${formIndex}"]');
  if (!form) return [];
  const clean = (text) => (text || "").replace(/\\s+/g, " ").trim().slice(0, ${MAX_LINE_CHARS});
  const describedText = (el) => {
    const id = el.getAttribute("aria-describedby");
    const target = id ? document.getElementById(id.split(" ")[0]) : null;
    return target ? clean(target.textContent) : "";
  };
  return [...form.querySelectorAll(":invalid, [aria-invalid='true']")]
    .filter((el) => el.tagName !== "FORM" && el.tagName !== "FIELDSET")
    .slice(0, ${MAX_FIELDS})
    .map((el) => ({
      label: clean(el.getAttribute("aria-label") || (el.labels && el.labels[0] ? el.labels[0].textContent : "") || el.getAttribute("name") || el.tagName.toLowerCase()),
      message: clean(el.validationMessage || describedText(el)),
    }));
})()`;
}
