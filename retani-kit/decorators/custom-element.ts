


/**
 * Decorator to define a custom element.
 * @param tagName - The name of the custom element.
 */
export function customElement(tagName: string) {
    return function <T extends { new (...args: any[]): HTMLElement }>(constructor: T) {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, constructor);
        }
    }
}