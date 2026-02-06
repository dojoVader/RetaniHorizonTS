class n extends HTMLElement {
  constructor() {
    super();
    const t = this.attachShadow({ mode: "open" }), e = document.createElement("div");
    e.textContent = "This is a sample web component!", t.appendChild(e);
  }
}
customElements.define("sample-component", n);
export {
  n as Sample
};
