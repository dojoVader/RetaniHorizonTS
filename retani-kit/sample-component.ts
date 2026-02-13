import {customElement} from "./decorators/custom-element.ts";
import {Component} from "@theme/component";



@customElement('sample-component')
export class Sample extends Component {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const wrapper = document.createElement('div');
        wrapper.textContent = 'This is a sample web component!';
        console.log("This is Firing....")
        shadow.appendChild(wrapper);
    }
}


