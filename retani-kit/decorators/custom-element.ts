import {Component} from '@theme/component';


// Handles both standard HTML elements and custom components in the context of defining a custom element.
type ShopifyComponent = HTMLElement | Component;

/**
 * Decorator to define a custom element.
 * @param tagName - The name of the custom element.
 */
export function customElement(tagName: string) {
    return function <T extends { new (...args: any[]): ShopifyComponent}>(constructor: T) {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, constructor);
        }
    }
}