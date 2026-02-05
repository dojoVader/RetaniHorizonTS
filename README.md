# Horizon

[Getting started](#getting-started) |
[Staying up to date with Horizon changes](#staying-up-to-date-with-horizon-changes) |
[Developer tools](#developer-tools) |
[Decorators](#decorators) |
[Contributing](#contributing) |
[License](#license)

Horizon is the flagship of a new generation of first party Shopify themes. It incorporates the latest Liquid Storefronts features, including [theme blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/quick-start?framework=liquid).

- **Web-native in its purest form:** Themes run on the [evergreen web](https://www.w3.org/2001/tag/doc/evergreen-web/). We leverage the latest web browsers to their fullest, while maintaining support for the older ones through progressive enhancement—not polyfills.
- **Lean, fast, and reliable:** Functionality and design defaults to “no” until it meets this requirement. Code ships on quality. Themes must be built with purpose. They shouldn’t support each and every feature in Shopify.
- **Server-rendered:** HTML must be rendered by Shopify servers using Liquid. Business logic and platform primitives such as translations and money formatting don’t belong on the client. Async and on-demand rendering of parts of the page is OK, but we do it sparingly as a progressive enhancement.
- **Functional, not pixel-perfect:** The Web doesn’t require each page to be rendered pixel-perfect by each browser engine. Using semantic markup, progressive enhancement, and clever design, we ensure that themes remain functional regardless of the browser.

## Getting started

We recommend using the Skeleton Theme as a starting point for a theme development project. [Learn more on Shopify.dev](https://shopify.dev/themes/getting-started/create).

To create a new theme project based on Horizon:

```sh
git clone https://github.com/Shopify/horizon.git
```

Install the [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) to connect your local project to a Shopify store. Learn about the [theme developer tools](https://shopify.dev/docs/storefronts/themes/tools) available, and the suggested [developer tools](#developer-tools) below.

Please note that the `main` branch may include code for features not yet released. You may encounter Liquid API properties that are not publicly documented, but will be when the feature is officially rolled out.

### Shopify Theme Store development

If you're building a theme for the Shopify Theme Store, then do not use Horizon as a starting point. Themes based on, derived from, or incorporating Horizon are not eligible for submission to to the Shopify Theme Store. Use the [Skeleton Theme](https://github.com/Shopify/skeleton-theme) instead.

## Staying up to date with Horizon changes

Say you're building a new theme off Horizon but you still want to be able to pull in the latest changes, you can add a remote `upstream` pointing to this Horizon repository.

1. Navigate to your local theme folder.
2. Verify the list of remotes and validate that you have both an `origin` and `upstream`:

```sh
git remote -v
```

3. If you don't see an `upstream`, you can add one that points to Shopify's Horizon repository:

```sh
git remote add upstream https://github.com/Shopify/horizon.git
```

4. Pull in the latest Horizon changes into your repository:

```sh
git fetch upstream
git pull upstream main
```

## Developer tools

There are a number of really useful tools that the Shopify Themes team uses during development. Horizon is already set up to work with these tools.

### Shopify CLI

[Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) helps you build Shopify themes faster and is used to automate and enhance your local development workflow. It comes bundled with a suite of commands for developing Shopify themes—everything from working with themes on a Shopify store (e.g. creating, publishing, deleting themes) or launching a development server for local theme development.

You can follow this [quick start guide for theme developers](https://shopify.dev/docs/themes/tools/cli) to get started.

### Theme Check

We recommend using [Theme Check](https://github.com/shopify/theme-check) as a way to validate and lint your Shopify themes.

We've added Theme Check to Horizon's [list of VS Code extensions](/.vscode/extensions.json) so if you're using Visual Studio Code as your code editor of choice, you'll be prompted to install the [Theme Check VS Code](https://marketplace.visualstudio.com/items?itemName=Shopify.theme-check-vscode) extension upon opening VS Code after you've forked and cloned Horizon.

You can also run it from a terminal with the following Shopify CLI command:

```bash
shopify theme check
```

You can follow the [theme check documentation](https://shopify.dev/docs/storefronts/themes/tools/theme-check) for more details.

#### Shopify/theme-check-action

Horizon runs [Theme Check](#Theme-Check) on every commit via [Shopify/theme-check-action](https://github.com/Shopify/theme-check-action).

## Decorators

This section provides a guide to using TypeScript decorators in RetaniHorizonTS for enhancing HTMLElements in Web Components and interacting with Shopify APIs such as Section Rendering and Ajax API. Decorators offer a declarative way to add functionality to components and API interactions.

### Prerequisites

- Node.js (version 16 or higher)
- Basic knowledge of TypeScript, decorators, and Web Components
- Vite for building

### Setup with Vite

1. Ensure Vite is installed in your project:

   ```sh
   npm install vite --save-dev
   ```

2. Configure `vite.config.ts` for TypeScript and Web Components:

   ```typescript
   import { defineConfig } from 'vite';

   export default defineConfig({
     build: {
       lib: {
         entry: 'src/sample-component.ts',
         name: 'RetaniDecorators',
         fileName: 'retani-decorators',
       },
       rollupOptions: {
         external: ['@shopify/theme-scripts'],
         output: {
           globals: {
             '@shopify/theme-scripts': 'ShopifyThemeScripts',
           },
         },
       },
     },
   });
   ```

3. Enable decorators in `tsconfig.json`:

   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true
     }
   }
   ```

### Decorators for HTMLElement in Web Components

Decorators can define custom elements and add behaviors to HTMLElements.

#### Custom Element Decorator

```typescript
// src/decorators/customElement.ts
export function customElement(tagName: string) {
  return function (constructor: any) {
    customElements.define(tagName, constructor);
  };
}
```

Usage:

```typescript
// src/components/MyComponent.ts
import { customElement } from '../decorators/customElement';

@customElement('my-component')
export class MyComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<p>Hello from Web Component!</p>';
  }
}
```

### Decorators for Shopify APIs

Decorators can handle interactions with Shopify APIs like Section Rendering and Ajax API.

#### Section Rendering Decorator

```typescript
// src/decorators/sectionRender.ts
export function sectionRender(sectionId: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        const response = await fetch(`/?section_id=${sectionId}`);
        const html = await response.text();
        return originalMethod.call(this, html);
      } catch (error) {
        console.error('Section rendering failed:', error);
      }
    };
  };
}
```

Usage:

```typescript
// src/components/HeaderSection.ts
import { sectionRender } from '../decorators/sectionRender';
import { customElement } from '../decorators/customElement';

@customElement('header-section')
export class HeaderSection extends HTMLElement {
  @sectionRender('header')
  async renderSection(html: string) {
    this.innerHTML = html;
  }

  connectedCallback() {
    this.renderSection();
  }
}
```

#### Ajax API Decorator

```typescript
// src/decorators/ajaxApi.ts
export function ajaxApi(url: string, method: 'GET' | 'POST' = 'GET') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'POST' ? JSON.stringify(args[0]) : undefined,
        });
        const data = await response.json();
        return originalMethod.call(this, data);
      } catch (error) {
        console.error('Ajax API request failed:', error);
      }
    };
  };
}
```

Usage for Cart API:

```typescript
// src/components/CartButton.ts
import { ajaxApi } from '../decorators/ajaxApi';
import { customElement } from '../decorators/customElement';

@customElement('cart-button')
export class CartButton extends HTMLElement {
  @ajaxApi('/cart/add.js', 'POST')
  async addToCart(data: any) {
    console.log('Item added:', data);
  }

  connectedCallback() {
    this.innerHTML = '<button>Add to Cart</button>';
    this.querySelector('button')?.addEventListener('click', () => this.addToCart({ id: 123, quantity: 1 }));
  }
}
```

#### Cart API Decorator

The Cart API decorator provides utilities and decorators for interacting with Shopify's Cart API, including adding items, updating quantities, and retrieving cart data.

```typescript
// src/decorators/cart-api.ts
import { fetchConfig } from '../core/utilities';

/**
 * Interface for cart item
 */
export interface CartItem {
  id: number;
  quantity: number;
  variant_id?: number;
  properties?: Record<string, any>;
  [key: string]: any;
}

/**
 * Interface for cart response
 */
export interface CartResponse {
  items: CartItem[];
  total_price: number;
  item_count: number;
  [key: string]: any;
}

/**
 * Shopify Cart API utilities
 */
export class CartAPI {
  /**
   * Get the current cart
   */
  static async getCart(): Promise<CartResponse> {
    const response = await fetch('/cart.js', fetchConfig('json'));
    if (!response.ok) {
      throw new Error('Failed to get cart');
    }
    return response.json();
  }

  /**
   * Add item to cart
   */
  static async addToCart(item: CartItem): Promise<CartResponse> {
    const response = await fetch('/cart/add.js', fetchConfig('json', { body: JSON.stringify(item) }));
    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }
    return response.json();
  }

  // ... other methods
}

/**
 * Decorator for adding to cart
 */
export function AddToCart(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return CartOperation('addToCart')(target, propertyKey, descriptor);
}

// ... other decorators
```

Usage:

```typescript
// src/components/ProductCard.ts
import { AddToCart, CartItem } from '../decorators/cart-api';
import { customElement } from '../decorators/customElement';

@customElement('product-card')
export class ProductCard extends HTMLElement {
  @AddToCart
  async handleAddToCart(cartResponse: any, item: CartItem) {
    console.log('Item added to cart:', cartResponse);
    // Update UI or handle success
  }

  connectedCallback() {
    this.innerHTML = '<button>Add to Cart</button>';
    this.querySelector('button')?.addEventListener('click', () => {
      this.handleAddToCart({ id: 123, quantity: 1 });
    });
  }
}
```

#### Product API Decorator

The Product API decorator provides utilities and decorators for interacting with Shopify's Product API, including fetching individual products, searching products, and getting recommendations.

```typescript
// src/decorators/product-api.ts
import { fetchConfig } from '../core/utilities';

/**
 * Interface for product
 */
export interface Product {
  id: number;
  title: string;
  handle: string;
  description: string;
  variants: ProductVariant[];
  images: ProductImage[];
  price: number;
  compare_at_price?: number;
  available: boolean;
  [key: string]: any;
}

/**
 * Interface for product variant
 */
export interface ProductVariant {
  id: number;
  title: string;
  price: number;
  compare_at_price?: number;
  available: boolean;
  [key: string]: any;
}

/**
 * Interface for product image
 */
export interface ProductImage {
  id: number;
  src: string;
  alt?: string;
  [key: string]: any;
}

/**
 * Interface for product response
 */
export interface ProductResponse {
  product: Product;
  [key: string]: any;
}

/**
 * Shopify Product API utilities
 */
export class ProductAPI {
  /**
   * Get a product by handle
   */
  static async getProduct(handle: string): Promise<ProductResponse> {
    const response = await fetch(`/products/${handle}.js`, fetchConfig('json'));
    if (!response.ok) {
      throw new Error('Failed to get product');
    }
    return response.json();
  }

  // ... other methods
}

/**
 * Decorator for getting a product
 */
export function GetProduct(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return ProductOperation('getProduct')(target, propertyKey, descriptor);
}

// ... other decorators
```

Usage:

```typescript
// src/components/ProductDetails.ts
import { GetProduct, ProductResponse } from '../decorators/product-api';
import { customElement } from '../decorators/customElement';

@customElement('product-details')
export class ProductDetails extends HTMLElement {
  @GetProduct
  async loadProduct(product: ProductResponse, handle: string) {
    console.log('Product loaded:', product);
    this.renderProduct(product);
  }

  private renderProduct(product: ProductResponse) {
    this.innerHTML = `
      <h1>${product.title}</h1>
      <p>${product.description}</p>
      <p>Price: $${product.price}</p>
    `;
  }

  connectedCallback() {
    const handle = this.getAttribute('handle') || 'default-product';
    this.loadProduct(handle);
  }
}
```

#### Predictive Search API Decorator

The Predictive Search API decorator provides utilities and decorators for interacting with Shopify's Predictive Search API, enabling search suggestions for products, collections, pages, and articles.

```typescript
// src/decorators/predictive-search-api.ts
import { fetchConfig } from '../core/utilities';

/**
 * Interface for search result
 */
export interface SearchResult {
  id: number;
  title: string;
  handle: string;
  url: string;
  price?: number;
  compare_at_price?: number;
  available: boolean;
  image?: string;
  [key: string]: any;
}

/**
 * Interface for predictive search response
 */
export interface PredictiveSearchResponse {
  resources: {
    results: {
      products?: SearchResult[];
      collections?: SearchResult[];
      pages?: SearchResult[];
      articles?: SearchResult[];
    };
    query: string;
  };
  [key: string]: any;
}

/**
 * Shopify Predictive Search API utilities
 */
export class PredictiveSearchAPI {
  /**
   * Perform predictive search
   */
  static async search(query: string, options: {
    resources?: {
      type: 'product' | 'collection' | 'page' | 'article';
      limit?: number;
    }[];
    unavailable_products?: 'show' | 'hide' | 'last';
  } = {}): Promise<PredictiveSearchResponse> {
    // ... implementation
  }

  // ... other methods
}

/**
 * Decorator for searching products
 */
export function SearchProducts(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return SearchOperation('searchProducts')(target, propertyKey, descriptor);
}

// ... other decorators
```

Usage:

```typescript
// src/components/SearchInput.ts
import { SearchProducts, SearchResult } from '../decorators/predictive-search-api';
import { customElement } from '../decorators/customElement';

@customElement('search-input')
export class SearchInput extends HTMLElement {
  @SearchProducts
  async handleSearch(results: SearchResult[], query: string) {
    console.log('Search results:', results);
    this.renderResults(results);
  }

  private renderResults(results: SearchResult[]) {
    const resultsHtml = results.map(result => `
      <div class="search-result">
        <img src="${result.image}" alt="${result.title}" />
        <h3>${result.title}</h3>
        <p>$${result.price}</p>
      </div>
    `).join('');
    this.querySelector('.results')!.innerHTML = resultsHtml;
  }

  connectedCallback() {
    this.innerHTML = `
      <input type="text" placeholder="Search products..." />
      <div class="results"></div>
    `;
    const input = this.querySelector('input')!;
    input.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (query.length > 2) {
        this.handleSearch(query);
      }
    });
  }
}
```

### Building and Integration

1. Build the decorators:

   ```sh
   npm run build
   ```

2. Include the output in your theme's assets and load in Liquid templates.

Test in a Shopify development store to ensure compatibility.

## Contributing

We are not accepting contributions to Horizon at this time.

## License

Copyright (c) 2025-present Shopify Inc. See [LICENSE](/LICENSE.md) for further details.
