function N(t) {
  return function(e) {
    customElements.get(t) || customElements.define(t, e);
  };
}
const q = typeof window.requestIdleCallback == "function" ? window.requestIdleCallback : (t) => setTimeout(t);
matchMedia("(prefers-reduced-motion: reduce)");
matchMedia("(min-width: 750px)");
class v extends HTMLElement {
  shimmer() {
    this.setAttribute("shimmer", "");
  }
}
customElements.get("text-component") || customElements.define("text-component", v);
class S {
  #e = /* @__PURE__ */ new Set();
  #t = !1;
  schedule = async (e) => {
    this.#e.add(e), this.#t || (this.#t = !0, requestAnimationFrame(this.flush));
  };
  flush = () => {
    for (const e of this.#e)
      setTimeout(e, 0);
    this.#e.clear(), this.#t = !1;
  };
}
const T = new S();
typeof Theme < "u" && (Theme.utilities = {
  ...Theme.utilities,
  scheduler: T
});
class A extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      const e = this.querySelector(':scope > template[shadowrootmode="open"]');
      if (!(e instanceof HTMLTemplateElement)) return;
      this.attachShadow({ mode: "open" }).append(e.content.cloneNode(!0));
    }
  }
}
class h extends A {
  /**
   * An object holding references to child elements with `ref` attributes.
   */
  refs = {};
  /**
   * An array of required refs. If a ref is not found, an error will be thrown.
   */
  requiredRefs;
  /**
   * Gets the root node of the component, which is either its shadow root or the component itself.
   */
  get roots() {
    return this.shadowRoot ? [this, this.shadowRoot] : [this];
  }
  /**
   * Called when the element is connected to the document's DOM.
   *
   * Initializes event listeners and refs.
   */
  connectedCallback() {
    super.connectedCallback(), L(), this.#e(), q(() => {
      for (const e of this.roots)
        this.#t.observe(e, {
          childList: !0,
          subtree: !0,
          attributes: !0,
          attributeFilter: ["ref"],
          attributeOldValue: !0
        });
    });
  }
  /**
   * Called when the element is re-rendered by the Section Rendering API.
   */
  updatedCallback() {
    this.#t.takeRecords(), this.#e();
  }
  /**
   * Called when the element is disconnected from the document's DOM.
   *
   * Disconnects the mutation observer.
   */
  disconnectedCallback() {
    this.#t.disconnect();
  }
  /**
   * Updates the `refs` object by querying all descendant elements with `ref` attributes and storing references to them.
   *
   * This method is called to keep the `refs` object in sync with the DOM.
   */
  #e() {
    const e = {}, n = this.roots.reduce((r, s) => {
      for (const o of s.querySelectorAll("[ref]"))
        this.#s(o) && r.add(o);
      return r;
    }, /* @__PURE__ */ new Set());
    for (const r of n) {
      const s = r.getAttribute("ref") ?? "", o = s.endsWith("[]"), i = o ? s.slice(0, -2) : s;
      if (o) {
        const c = Array.isArray(e[i]) ? e[i] : [];
        c.push(r), e[i] = c;
      } else
        e[i] = r;
    }
    if (this.requiredRefs?.length) {
      for (const r of this.requiredRefs)
        if (!(r in e))
          throw new O(r, this);
    }
    this.refs = e;
  }
  /**
   * MutationObserver instance to observe changes in the component's DOM subtree and update refs accordingly.
   */
  #t = new MutationObserver((e) => {
    e.some(
      (n) => n.type === "attributes" && this.#s(n.target) || n.type === "childList" && [...n.addedNodes, ...n.removedNodes].some(this.#s)
    ) && this.#e();
  });
  /**
   * Checks if a given node is a descendant of this component.
   */
  #s = (e) => m(R(e)) === this;
}
function R(t) {
  if (t.parentNode) return t.parentNode;
  const e = t.getRootNode();
  return e instanceof ShadowRoot ? e.host : null;
}
function m(t) {
  if (!t) return null;
  if (t instanceof h || t instanceof HTMLElement && t.tagName.toLowerCase().endsWith("-component")) return t;
  const e = R(t);
  return e ? m(e) : null;
}
let E = !1;
function L() {
  if (E) return;
  E = !0;
  const t = ["click", "change", "select", "focus", "blur", "submit", "input", "keydown", "keyup", "toggle"], e = ["focus", "blur"], n = ["pointerenter", "pointerleave"];
  for (const s of [...t, ...n]) {
    const o = `on:${s}`;
    document.addEventListener(
      s,
      (i) => {
        const c = r(i);
        if (!c) return;
        const k = i.target !== c ? new Proxy(i, {
          get(a, y) {
            if (y === "target") return c;
            const d = Reflect.get(a, y);
            return typeof d == "function" ? d.bind(a) : d;
          }
        }) : i, p = c.getAttribute(o) ?? "";
        let [u, l] = p.split("/");
        const b = p.match(/([\/\?][^\/\?]+)([\/\?][^\/\?]+)$/), w = b ? b[2] : null, f = u ? u.startsWith("#") ? document.querySelector(u) : c.closest(u) : m(c);
        if (!(f instanceof h) || !l) return;
        l = l.replace(/\?.*/, "");
        const g = f[l];
        if (typeof g == "function")
          try {
            const a = [k];
            w && a.unshift(M(w)), g.call(f, ...a);
          } catch (a) {
            console.error(a);
          }
      },
      { capture: !0 }
    );
  }
  function r(s) {
    const o = s.composedPath?.()[0] ?? s.target;
    return o instanceof Element ? o.hasAttribute(`on:${s.type}`) ? o : n.includes(s.type) ? null : s.bubbles || e.includes(s.type) ? o.closest(`[on\\:${s.type}]`) : null : null;
  }
}
function M(t) {
  const e = t[0], n = t.slice(1);
  return e === "?" ? Object.fromEntries(
    Array.from(new URLSearchParams(n).entries()).map(([r, s]) => [r, C(s)])
  ) : C(n);
}
function C(t) {
  if (t === "true") return !0;
  if (t === "false") return !1;
  const e = Number(t);
  return !isNaN(e) && t.trim() !== "" ? e : t;
}
class O extends Error {
  constructor(e, n) {
    super(`Required ref "${e}" not found in component ${n.tagName.toLowerCase()}`);
  }
}
var $ = Object.getOwnPropertyDescriptor, D = (t, e, n, r) => {
  for (var s = r > 1 ? void 0 : r ? $(e, n) : e, o = t.length - 1, i; o >= 0; o--)
    (i = t[o]) && (s = i(s) || s);
  return s;
};
let x = class extends h {
  constructor() {
    super();
    const t = this.attachShadow({ mode: "open" }), e = document.createElement("div");
    e.textContent = "This is a sample web component!", t.appendChild(e);
  }
};
x = D([
  N("sample-component")
], x);
export {
  x as Sample
};
