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
    const params = new URLSearchParams();
    params.append('q', query);

    if (options.resources) {
      options.resources.forEach((resource, index) => {
        params.append(`resources[type][${index}]`, resource.type);
        if (resource.limit) {
          params.append(`resources[limit][${index}]`, resource.limit.toString());
        }
      });
    }

    if (options.unavailable_products) {
      params.append('unavailable_products', options.unavailable_products);
    }

    const response = await fetch(`/search/suggestions.json?${params.toString()}`, fetchConfig('json'));
    if (!response.ok) {
      throw new Error('Failed to perform predictive search');
    }
    return response.json();
  }

  /**
   * Search for products only
   */
  static async searchProducts(query: string, limit: number = 10): Promise<SearchResult[]> {
    const result = await this.search(query, {
      resources: [{ type: 'product', limit }]
    });
    return result.resources.results.products || [];
  }

  /**
   * Search for collections only
   */
  static async searchCollections(query: string, limit: number = 5): Promise<SearchResult[]> {
    const result = await this.search(query, {
      resources: [{ type: 'collection', limit }]
    });
    return result.resources.results.collections || [];
  }

  /**
   * Search for pages only
   */
  static async searchPages(query: string, limit: number = 5): Promise<SearchResult[]> {
    const result = await this.search(query, {
      resources: [{ type: 'page', limit }]
    });
    return result.resources.results.pages || [];
  }

  /**
   * Search for articles only
   */
  static async searchArticles(query: string, limit: number = 5): Promise<SearchResult[]> {
    const result = await this.search(query, {
      resources: [{ type: 'article', limit }]
    });
    return result.resources.results.articles || [];
  }
}

/**
 * Decorator to handle search operations on a method
 * @param operation The search operation to perform
 */
export function SearchOperation(operation: keyof typeof PredictiveSearchAPI) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Perform the search operation
        const result = await (PredictiveSearchAPI[operation] as any)(...args);
        // Call the original method with the result
        return originalMethod.call(this, result, ...args);
      } catch (error) {
        console.error(`Search operation ${operation} failed:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for predictive search
 */
export function PredictiveSearch(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return SearchOperation('search')(target, propertyKey, descriptor);
}

/**
 * Decorator for searching products
 */
export function SearchProducts(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return SearchOperation('searchProducts')(target, propertyKey, descriptor);
}

/**
 * Decorator for searching collections
 */
export function SearchCollections(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return SearchOperation('searchCollections')(target, propertyKey, descriptor);
}

/**
 * Decorator for searching pages
 */
export function SearchPages(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return SearchOperation('searchPages')(target, propertyKey, descriptor);
}

/**
 * Decorator for searching articles
 */
export function SearchArticles(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return SearchOperation('searchArticles')(target, propertyKey, descriptor);
}
