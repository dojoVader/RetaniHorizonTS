import {customElement} from "./decorators/custom-element.ts";
import {Component} from "./core/component";



@customElement('sample-component')
export class Sample extends Component {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const wrapper = document.createElement('div');
        wrapper.textContent = 'This is a sample web component!';
        shadow.appendChild(wrapper);
    }
}


