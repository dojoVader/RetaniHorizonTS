/**
 * Request an idle callback or fallback to setTimeout
 */
export const requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number =
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback
    : (callback) => setTimeout(callback);

/**
 * Returns a promise that resolves after yielding to the main thread.
 * @see https://web.dev/articles/optimize-long-tasks#scheduler-yield
 */
export const yieldToMainThread = (): Promise<void> => {
  if ('yield' in scheduler) {
    // @ts-ignore - TypeScript doesn't recognize the yield method yet.
    return scheduler.yield();
  }

  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
};

/**
 * Tells if we are on a low power device based on the number of CPU cores and RAM
 */
export function isLowPowerDevice(): boolean {
  return Number(navigator.hardwareConcurrency) <= 2 || Number(navigator.deviceMemory) <= 2;
}

/**
 * Check if the browser supports View Transitions API
 */
export function supportsViewTransitions(): boolean {
  return typeof document.startViewTransition === 'function';
}

/**
 * The current view transition
 */
export const viewTransition: { current: Promise<void> | undefined } = {
  current: undefined,
};

/**
 * Functions to run when a view transition of a given type is started
 */
const viewTransitionTypes: { [key: string]: () => Promise<(() => void) | undefined> } = {
  'product-grid': async (): Promise<(() => void) | undefined> => {
    const grid = document.querySelector('.product-grid');
    const productCards: HTMLElement[] = [
      ...document.querySelectorAll('.product-grid .product-grid__item'),
    ] as HTMLElement[];

    if (!grid || !productCards.length) return;

    await new Promise<void>((resolve) =>
      requestIdleCallback(() => {
        const cardsToAnimate = getCardsToAnimate(grid, productCards);

        productCards.forEach((card, index) => {
          if (index < cardsToAnimate) {
            card.style.setProperty('view-transition-name', `product-card-${card.dataset.productId}`);
          } else {
            card.style.setProperty('content-visibility', 'hidden');
          }
        });

        resolve();
      })
    );

    return () =>
      productCards.forEach((card) => {
        card.style.removeProperty('view-transition-name');
        card.style.removeProperty('content-visibility');
      });
  },
};

/**
 * Starts a view transition
 */
export function startViewTransition(callback: () => void, types?: string[]): Promise<void> {
  // Check if the API is supported and transitions are desired
  if (!supportsViewTransitions() || isLowPowerDevice() || prefersReducedMotion()) {
    callback();
    return Promise.resolve();
  }

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (resolve) => {
    let cleanupFunctions: (() => void)[] = [];

    if (types) {
      for (const type of types) {
        if (viewTransitionTypes[type]) {
          const cleanupFunction = await viewTransitionTypes[type]();
          if (cleanupFunction) cleanupFunctions.push(cleanupFunction);
        }
      }
    }

    const transition = document.startViewTransition(callback);

    if (!viewTransition.current) {
      viewTransition.current = transition.finished;
    }

    if (types) types.forEach((type) => transition.types.add(type));

    transition.finished.then(() => {
      viewTransition.current = undefined;
      cleanupFunctions.forEach((cleanupFunction) => cleanupFunction());
      resolve();
    });
  });
}

type Headers = { [key: string]: string | undefined };

interface FetchConfig {
  method: string;
  headers: Headers;
  body?: string | FormData;
}

/**
 * Creates a fetch configuration object
 */
export function fetchConfig(type: string = 'json', config: Partial<FetchConfig> = {}): RequestInit {
  const headers: Headers = { 'Content-Type': 'application/json', Accept: `application/${type}`, ...config.headers };

  if (type === 'javascript') {
    headers['X-Requested-With'] = 'XMLHttpRequest';
    delete headers['Content-Type'];
  }

  return {
    method: 'POST',
    headers: headers as HeadersInit,
    body: config.body,
  };
}

/**
 * Creates a debounced function that delays calling the provided function (fn)
 * until after wait milliseconds have elapsed since the last time
 * the debounced function was invoked. The returned function has a .cancel()
 * method to cancel any pending calls.
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T & { cancel(): void } {
  let timeout: number | undefined;

  function debounced(this: any, ...args: Parameters<T>): void {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  }

  // Add the .cancel method:
  debounced.cancel = (): void => {
    clearTimeout(timeout);
  };

  return debounced as T & { cancel(): void };
}

/**
 * Creates a throttled function that calls the provided function (fn) at most once per every wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T & { cancel(): void } {
  let lastCall = 0;

  function throttled(this: any, ...args: Parameters<T>): void {
    const now = performance.now();
    // If the time since the last call exceeds the delay, execute the callback
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  }

  throttled.cancel = (): void => {
    lastCall = performance.now();
  };

  return throttled as T & { cancel(): void };
}

/**
 * A media query for reduced motion
 */
const reducedMotion: MediaQueryList = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Check if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return reducedMotion.matches;
}

/**
 * Normalize a string
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Check if the document is ready/loaded and call the callback when it is.
 */
export function onDocumentLoaded(callback: () => void): void {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

/**
 * Check if the DOM is ready and call the callback when it is.
 * This fires when the DOM is fully parsed but before all resources are loaded.
 */
export function onDocumentReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Removes will-change from an element after an animation ends.
 * Intended to be used as an animationend event listener.
 */
export function removeWillChangeOnAnimationEnd(event: AnimationEvent): void {
  const target = event.target;
  if (target && target instanceof HTMLElement) {
    target.style.setProperty('will-change', 'unset');
    target.removeEventListener('animationend', removeWillChangeOnAnimationEnd);
  }
}

/**
 * Wait for all animations to finish before calling the callback.
 */
export function onAnimationEnd(
  elements: Element | Element[],
  callback?: () => void,
  options: GetAnimationsOptions = { subtree: true }
): Promise<void> {
  const animations = Array.isArray(elements)
    ? elements.flatMap((element) => element.getAnimations(options))
    : elements.getAnimations(options);
  const animationPromises: Promise<Animation>[] = animations.reduce((acc, animation) => {
    // Ignore ViewTimeline animations
    if (animation.timeline instanceof DocumentTimeline) {
      acc.push(animation.finished);
    }

    return acc;
  }, [] as Promise<Animation>[]);

  return Promise.allSettled(animationPromises).then(callback);
}

/**
 * Check if the click is outside the element.
 */
export function isClickedOutside(event: MouseEvent, element: Element): boolean {
  if (event.target instanceof HTMLDialogElement || !(event.target instanceof Element)) {
    return !isPointWithinElement(event.clientX, event.clientY, element);
  }

  return !element.contains(event.target);
}

/**
 * Check if a point is within an element.
 */
export function isPointWithinElement(x: number, y: number, element: Element): boolean {
  const { left, right, top, bottom } = element.getBoundingClientRect();

  return x >= left && x <= right && y >= top && y <= bottom;
}

/**
 * A media query for large screens
 */
export const mediaQueryLarge: MediaQueryList = matchMedia('(min-width: 750px)');

/**
 * Check if the current breakpoint is mobile
 */
export function isMobileBreakpoint(): boolean {
  return !mediaQueryLarge.matches;
}

/**
 * Check if the current breakpoint is desktop
 */
export function isDesktopBreakpoint(): boolean {
  return mediaQueryLarge.matches;
}

/**
 * Check if the device is a touch device independently of the screen size
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window && navigator.maxTouchPoints > 0;
}

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Calculates the center point of an element along the specified axis.
 */
export function center<T extends 'x' | 'y'>(
  element: Element,
  axis?: T
): T extends 'x' | 'y' ? number : { x: number; y: number } {
  const { left, width, top, height } = element.getBoundingClientRect();
  const point = {
    x: left + width / 2,
    y: top + height / 2,
  };

  if (axis) return point[axis] as any;

  return point as any;
}

/**
 * Calculates the start point of an element along the specified axis.
 */
export function start(element: Element, axis?: 'x' | 'y'): number | { x: number; y: number } {
  const { left, top } = element.getBoundingClientRect();
  const point = { x: left, y: top };

  if (axis) return point[axis];

  return point;
}

/**
 * Finds the value in an array that is closest to a target value.
 */
export function closest(values: number[], target: number): number {
  return values.reduce(function (prev, curr) {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
}

/**
 * Prevents the default action of an event.
 */
export function preventDefault(event: Event): void {
  event.preventDefault();
}

/**
 * Get the visible elements within a root element.
 */
export function getVisibleElements<T extends Element>(
  root: Element,
  elements: T[] | undefined,
  ratio: number = 1,
  axis?: 'x' | 'y'
): T[] {
  if (!elements?.length) return [];
  const rootRect = root.getBoundingClientRect();

  return elements.filter((element) => {
    const { width, height, top, right, left, bottom } = element.getBoundingClientRect();

    if (ratio < 1) {
      const intersectionLeft = Math.max(rootRect.left, left);
      const intersectionRight = Math.min(rootRect.right, right);
      const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);

      if (axis === 'x') {
        return width > 0 && intersectionWidth / width >= ratio;
      }

      const intersectionTop = Math.max(rootRect.top, top);
      const intersectionBottom = Math.min(rootRect.bottom, bottom);
      const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

      if (axis === 'y') {
        return height > 0 && intersectionHeight / height >= ratio;
      }

      const intersectionArea = intersectionWidth * intersectionHeight;
      const elementArea = width * height;

      // Check that at least the specified ratio of the element is visible
      return elementArea > 0 && intersectionArea / elementArea >= ratio;
    }

    const isWithinX = left >= rootRect.left && right <= rootRect.right;
    if (axis === 'x') {
      return isWithinX;
    }

    const isWithinY = top >= rootRect.top && bottom <= rootRect.bottom;
    if (axis === 'y') {
      return isWithinY;
    }

    return isWithinX && isWithinY;
  });
}

export function getIOSVersion(): { fullString: string; major: number; minor: number } | null {
  const { userAgent } = navigator;
  const isIOS = /(iPhone|iPad)/i.test(userAgent);

  if (!isIOS) return null;

  const version = userAgent.match(/OS ([\d_]+)/)?.[1];
  const [major, minor] = version?.split('_') || [];
  if (!version || !major) return null;

  return {
    fullString: version.replace('_', '.'),
    major: parseInt(major, 10),
    minor: minor ? parseInt(minor, 10) : 0,
  };
}

/**
 * Determines which grid items should be animated during a transition.
 * It makes an estimation based on the zoom-out card size because it's
 * the common denominator for both transition states. I.e. transitioning either
 * from 10 to 20 cards the other way around, both need 20 cards to be animated.
 */
function getCardsToAnimate(grid: Element, cards: Element[]): number {
  if (!grid || !cards || cards.length === 0) return 0;

  const itemSample = cards[0];
  if (!itemSample) return 0;

  // Calculate the visible area of the grid for the Y axis. Assume X is always fully visible:
  const gridRect = grid.getBoundingClientRect();
  const visibleArea = {
    top: Math.max(0, gridRect.top),
    bottom: Math.min(window.innerHeight, gridRect.bottom),
  };

  const visibleHeight = Math.round(visibleArea.bottom - visibleArea.top);
  if (visibleHeight <= 0) return 0;

  // @ts-ignore: Custom element defined elsewhere
  const cardSample: HTMLElement | null = itemSample.querySelector('product-card');
  const gridStyle = getComputedStyle(grid);

  const galleryAspectRatio = cardSample?.style.getPropertyValue('--gallery-aspect-ratio') || '';
  let aspectRatio = parseFloat(galleryAspectRatio) || 0.5;
  if (galleryAspectRatio?.includes('/')) {
    const [width = '1', height = '2'] = galleryAspectRatio.split('/');
    aspectRatio = parseInt(width, 10) / parseInt(height, 10);
  }

  const cardGap = parseInt(cardSample?.style.getPropertyValue('--product-card-gap') || '') || 12;
  const gridGap = parseInt(gridStyle.getPropertyValue('--product-grid-gap')) || 12;

  // Assume only a couple of lines of text in the card details (title and price).
  // If the title wraps into more lines, we might just animate more cards, but that's fine.
  const detailsSize = ((parseInt(gridStyle.fontSize) || 16) + 2) * 2;

  const isMobile = window.innerWidth < 750;

  // Always use the zoom-out state card width
  const cardWidth = isMobile ? Math.round((gridRect.width - gridGap) / 2) : 100;
  const cardHeight = Math.round(cardWidth / aspectRatio) + cardGap + detailsSize;

  // Calculate the number of cards that fit in the visible area:
  // - The width estimation is pretty accurate, we can ignore decimals.
  // - The height estimation needs to account for peeking rows, so we round up.
  const columnsInGrid = isMobile ? 2 : Math.floor((gridRect.width + gridGap) / (cardWidth + gridGap));
  const rowsInGrid = Math.ceil((visibleHeight - gridGap) / (cardHeight + gridGap));

  return columnsInGrid * rowsInGrid;
}

/**
 * Preloads an image
 */
export function preloadImage(src: string): void {
  const image = new Image();
  image.src = src;
}

export class TextComponent extends HTMLElement {
  shimmer(): void {
    this.setAttribute('shimmer', '');
  }
}

if (!customElements.get('text-component')) {
  customElements.define('text-component', TextComponent);
}

/**
 * Resets the shimmer attribute on all elements in the container.
 */
export function resetShimmer(container: Element = document.body): void {
  const shimmer = container.querySelectorAll('[shimmer]');
  shimmer.forEach((item) => item.removeAttribute('shimmer'));
}

/**
 * Change the meta theme color of the browser.
 */
export function changeMetaThemeColor(color: string): void {
  const metaThemeColor = document.head.querySelector('meta[name="theme-color"]');
  if (metaThemeColor && color) {
    metaThemeColor.setAttribute('content', color);
  }
}

/**
 * Gets the `view` URL search parameter value, if it exists.
 * Useful for Section Rendering API calls to get HTML markup for the correct template view.
 * Primarily used in testing alternative template views.
 */
export function getViewParameterValue(): string | null {
  return new URLSearchParams(window.location.search).get('view');
}

/**
 * Helper to parse integer with a default fallback
 * Handles the case where 0 is a valid value (not falsy)
 */
export function parseIntOrDefault<T extends number | null>(
  value: string | number | null | undefined,
  defaultValue: T
): number | T {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
}

class Scheduler {
  #queue: Set<() => void> = new Set();
  #scheduled: boolean = false;

  schedule = async (task: () => void): Promise<void> => {
    this.#queue.add(task);

    if (!this.#scheduled) {
      this.#scheduled = true;

      // Wait for any in-progress view transitions to finish
      if (viewTransition.current) await viewTransition.current;

      requestAnimationFrame(this.flush);
    }
  };

  flush = (): void => {
    for (const task of this.#queue) {
      setTimeout(task, 0);
    }

    this.#queue.clear();
    this.#scheduled = false;
  };
}

export const scheduler = new Scheduler();

/**
 * Executes a callback once per session when in the Shopify theme editor
 */
export function oncePerEditorSession(element: HTMLElement, sessionKeyName: string, callback: () => void): void {
  const isInThemeEditor = window.Shopify?.designMode;
  const shopifyEditorSectionId = JSON.parse(element.dataset.shopifyEditorSection || '{}').id;
  const shopifyEditorBlockId = JSON.parse(element.dataset.shopifyEditorBlock || '{}').id;
  const editorId = shopifyEditorSectionId || shopifyEditorBlockId;
  const uniqueSessionKey = `${sessionKeyName}-${editorId}`;

  if (isInThemeEditor && sessionStorage.getItem(uniqueSessionKey)) return;

  callback();

  if (isInThemeEditor) sessionStorage.setItem(uniqueSessionKey, 'true');
}

/**
 * A custom ResizeObserver that only calls the callback when the element is resized.
 * By default the ResizeObserver callback is called when the element is first observed.
 */
export class ResizeNotifier extends ResizeObserver {
  #initialized: boolean = false;

  constructor(callback: ResizeObserverCallback) {
    super((entries) => {
      if (this.#initialized) return callback(entries, this);
      this.#initialized = true;
    });
  }

  disconnect(): void {
    this.#initialized = false;
    super.disconnect();
  }
}

/**
 * Sets the menuStyle dataset attribute on the header component element.
 */
export function setHeaderMenuStyle(): void {
  const headerComponent = document.querySelector('#header-component') as HTMLElement | null;
  if (headerComponent) {
    window.requestAnimationFrame(() => {
      // @ts-ignore: Custom element defined elsewhere
      const overflowList = headerComponent?.querySelector('overflow-list');
      const hasReachedMinimum = overflowList && overflowList.hasAttribute('minimum-reached');
      headerComponent.dataset.menuStyle = isTouchDevice() || hasReachedMinimum ? 'drawer' : 'menu';
    });
  }
}

// Header calculation functions for maintaining CSS variables
export function calculateHeaderGroupHeight(
  header: Element | null = document.querySelector('#header-component'),
  headerGroup: Element | null = document.querySelector('#header-group')
): number {
  if (!headerGroup) return 0;

  let totalHeight = 0;
  const children = headerGroup.children;
  for (let i = 0; i < children.length; i++) {
    const element = children[i];
    if (element === header || !(element instanceof HTMLElement)) continue;
    totalHeight += element.offsetHeight;
  }

  // If the header is transparent and has a sibling section, add the height of the header to the total height
  if (header instanceof HTMLElement && header.hasAttribute('transparent') && header.parentElement?.nextElementSibling) {
    return totalHeight + header.offsetHeight;
  }

  return totalHeight;
}

/**
 * Updates CSS custom properties for transparent header offset calculation
 * Avoids expensive :has() selectors
 */
function updateTransparentHeaderOffset(): void {
  const header = document.querySelector('#header-component');
  const headerGroup = document.querySelector('#header-group');
  const hasHeaderSection = headerGroup?.querySelector('.header-section');
  if (!hasHeaderSection || !header?.hasAttribute('transparent')) {
    document.body.style.setProperty('--transparent-header-offset-boolean', '0');
    return;
  }

  const hasImmediateSection = hasHeaderSection.nextElementSibling?.classList.contains('shopify-section');

  const shouldApplyOffset = !hasImmediateSection ? '1' : '0';
  document.body.style.setProperty('--transparent-header-offset-boolean', shouldApplyOffset);
}

/**
 * Initialize and maintain header height CSS variables.
 */
function updateHeaderHeights(): void {
  // @ts-ignore: Custom element defined elsewhere
  const header = document.querySelector('header-component');

  // Early exit if no header - nothing to do
  if (!(header instanceof HTMLElement)) return;

  // Calculate initial heights
  const headerHeight = header.offsetHeight;
  const headerGroupHeight = calculateHeaderGroupHeight(header);
  const headerMenuRow = header.querySelector('.header__row:has(.header-menu)') as HTMLElement | null;

  document.body.style.setProperty('--header-height', `${headerHeight}px`);
  document.body.style.setProperty('--header-group-height', `${headerGroupHeight}px`);

  if (headerMenuRow) {
    window.requestAnimationFrame(function () {
      header.style.setProperty('--menu-row-height', `${headerMenuRow.offsetHeight}px`);
    });
  }
}

export function updateAllHeaderCustomProperties(): void {
  updateHeaderHeights();
  updateTransparentHeaderOffset();
  setHeaderMenuStyle();
}

// Theme is not defined in some layouts, like the gift card page
if (typeof Theme !== 'undefined') {
  Theme.utilities = {
    ...Theme.utilities,
    scheduler: scheduler,
  };
}
