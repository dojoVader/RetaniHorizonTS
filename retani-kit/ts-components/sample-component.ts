
import {Component} from "@theme/component";
import {customElement} from "../decorators/custom-element";



@customElement('sample-component')
export class Sample extends Component {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const wrapper = document.createElement('div');
        wrapper.addEventListener('click',() => {
            console.log('You clicked the sample component!');
        })
        wrapper.textContent = 'Web Component generated in TS !';
        console.log("This is Firing....")
        shadow.appendChild(wrapper);

    }
}


