export class Sample extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const wrapper = document.createElement('div');
        wrapper.textContent = 'This is a sample web component!';
        shadow.appendChild(wrapper);
    }
}

customElements.define('sample-component', Sample);
