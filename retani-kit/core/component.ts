import { requestIdleCallback } from './utilities';

/*
 * Declarative shadow DOM is only initialized on the initial render of the page.
 * If the component is mounted after the browser finishes the initial render,
 * the shadow root needs to be manually hydrated.
 */
export class DeclarativeShadowElement extends HTMLElement {
  connectedCallback(): void {
    if (!this.shadowRoot) {
      const template = this.querySelector(':scope > template[shadowrootmode="open"]');

      if (!(template instanceof HTMLTemplateElement)) return;

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.append(template.content.cloneNode(true));
    }
  }
}

export type Refs = Record<string, Element | Element[] | undefined>;

export type RefsType<T extends Refs> = T & Refs;

export type Data = object | Array<string | number> | string;

/**
 * Base class that powers our custom web components.
 *
 * Manages references to child elements with `ref` attributes and sets up mutation observers to keep
 * the refs updated when the DOM changes. Also handles declarative event listeners using.
 */
export class Component<T extends Refs = Refs> extends DeclarativeShadowElement {
  /**
   * An object holding references to child elements with `ref` attributes.
   */
  refs: RefsType<T> = {} as RefsType<T>;

  /**
   * An array of required refs. If a ref is not found, an error will be thrown.
   */
  requiredRefs?: string[];

  /**
   * Gets the root node of the component, which is either its shadow root or the component itself.
   */
  get roots(): (ShadowRoot | Component<T>)[] {
    return this.shadowRoot ? [this, this.shadowRoot] : [this];
  }

  /**
   * Called when the element is connected to the document's DOM.
   *
   * Initializes event listeners and refs.
   */
  connectedCallback(): void {
    super.connectedCallback();
    registerEventListeners();

    this.#updateRefs();

    requestIdleCallback(() => {
      for (const root of this.roots) {
        this.#mutationObserver.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['ref'],
          attributeOldValue: true,
        });
      }
    });
  }

  /**
   * Called when the element is re-rendered by the Section Rendering API.
   */
  updatedCallback(): void {
    this.#mutationObserver.takeRecords();
    this.#updateRefs();
  }

  /**
   * Called when the element is disconnected from the document's DOM.
   *
   * Disconnects the mutation observer.
   */
  disconnectedCallback(): void {
    this.#mutationObserver.disconnect();
  }

  /**
   * Updates the `refs` object by querying all descendant elements with `ref` attributes and storing references to them.
   *
   * This method is called to keep the `refs` object in sync with the DOM.
   */
  #updateRefs(): void {
    const refs: any = {};
    const elements = this.roots.reduce((acc, root) => {
      for (const element of root.querySelectorAll('[ref]')) {
        if (!this.#isDescendant(element)) continue;
        acc.add(element);
      }

      return acc;
    }, new Set<Element>());

    for (const ref of elements) {
      const refName = ref.getAttribute('ref') ?? '';
      const isArray = refName.endsWith('[]');
      const path = isArray ? refName.slice(0, -2) : refName;

      if (isArray) {
        const array = Array.isArray(refs[path]) ? refs[path] : [];

        array.push(ref);
        refs[path] = array;
      } else {
        refs[path] = ref;
      }
    }

    if (this.requiredRefs?.length) {
      for (const ref of this.requiredRefs) {
        if (!(ref in refs)) {
          throw new MissingRefError(ref, this);
        }
      }
    }

    this.refs = refs as RefsType<T>;
  }

  /**
   * MutationObserver instance to observe changes in the component's DOM subtree and update refs accordingly.
   */
  #mutationObserver = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (m) =>
          (m.type === 'attributes' && this.#isDescendant(m.target)) ||
          (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].some(this.#isDescendant))
      )
    ) {
      this.#updateRefs();
    }
  });

  /**
   * Checks if a given node is a descendant of this component.
   */
  #isDescendant = (node: Node): boolean => getClosestComponent(getAncestor(node)) === this;
}

/**
 * Get the ancestor of a given node.
 */
function getAncestor(node: Node): Node | null {
  if (node.parentNode) return node.parentNode;

  const root = node.getRootNode();
  if (root instanceof ShadowRoot) return root.host;

  return null;
}

/**
 * Recursively finds the closest ancestor that is an instance of `Component`.
 */
function getClosestComponent(node: Node | null): HTMLElement | null {
  if (!node) return null;
  if (node instanceof Component) return node;
  if (node instanceof HTMLElement && node.tagName.toLowerCase().endsWith('-component')) return node;

  const ancestor = getAncestor(node);
  if (ancestor) return getClosestComponent(ancestor);

  return null;
}

/**
 * Initializes the event listeners for custom event handling.
 *
 * Sets up event listeners for specified events and delegates the handling of those events
 * to methods defined on the closest `Component` instance, based on custom attributes.
 */
let initialized = false;

function registerEventListeners(): void {
  if (initialized) return;
  initialized = true;

  const events = ['click', 'change', 'select', 'focus', 'blur', 'submit', 'input', 'keydown', 'keyup', 'toggle'];
  const shouldBubble = ['focus', 'blur'];
  const expensiveEvents = ['pointerenter', 'pointerleave'];

  for (const eventName of [...events, ...expensiveEvents]) {
    const attribute = `on:${eventName}`;

    document.addEventListener(
      eventName,
      (event) => {
        const element = getElement(event);

        if (!element) return;

        const proxiedEvent =
          event.target !== element
            ? new Proxy(event, {
                get(target, property) {
                  if (property === 'target') return element;

                  const value = Reflect.get(target, property);

                  if (typeof value === 'function') {
                    return value.bind(target);
                  }

                  return value;
                },
              })
            : event;

        const value = element.getAttribute(attribute) ?? '';
        let [selector, method] = value.split('/');
        // Extract the last segment of the attribute value delimited by `?` or `/`
        // Do not use lookback for Safari 16.0 compatibility
        const matches = value.match(/([\/\?][^\/\?]+)([\/\?][^\/\?]+)$/);
        const data = matches ? matches[2] : null;
        const instance = selector
          ? selector.startsWith('#')
            ? document.querySelector(selector)
            : element.closest(selector)
          : getClosestComponent(element);

        if (!(instance instanceof Component) || !method) return;

        method = method.replace(/\?.*/, '');

        const callback = (instance as any)[method];

        if (typeof callback === 'function') {
          try {
            const args: (Event | Data)[] = [proxiedEvent];

            if (data) args.unshift(parseData(data));

            callback.call(instance, ...args);
          } catch (error) {
            console.error(error);
          }
        }
      },
      { capture: true }
    );
  }

  function getElement(event: Event): Element | null {
    const target = event.composedPath?.()[0] ?? event.target;

    if (!(target instanceof Element)) return null;

    if (target.hasAttribute(`on:${event.type}`)) {
      return target;
    }

    if (expensiveEvents.includes(event.type)) {
      return null;
    }

    return event.bubbles || shouldBubble.includes(event.type) ? target.closest(`[on\\:${event.type}]`) : null;
  }
}

/**
 * Parses a string to extract data based on a delimiter.
 */
function parseData(str: string): Data {
  const delimiter = str[0];
  const data = str.slice(1);

  return delimiter === '?'
    ? Object.fromEntries(
        Array.from(new URLSearchParams(data).entries()).map(([key, value]) => [key, parseValue(value)])
      )
    : parseValue(data);
}

/**
 * Parses a string value to its appropriate type.
 */
function parseValue(str: string): any {
  if (str === 'true') return true;
  if (str === 'false') return false;

  const maybeNumber = Number(str);
  if (!isNaN(maybeNumber) && str.trim() !== '') return maybeNumber;

  return str;
}

/**
 * Throws a formatted error when a required ref is not found in the component.
 */
export class MissingRefError extends Error {
  constructor(ref: string, component: Component) {
    super(`Required ref "${ref}" not found in component ${component.tagName.toLowerCase()}`);
  }
}
