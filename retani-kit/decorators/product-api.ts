import { fetchConfig } from '@theme/utilities';

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
  sku: string;
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
export interface ProductResponse extends Product {}

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

  /**
   * Get multiple products by handles
   */
  static async getProducts(handles: string[]): Promise<ProductResponse[]> {
    const promises = handles.map(handle => this.getProduct(handle));
    return Promise.all(promises);
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, limit: number = 10): Promise<{ products: ProductResponse[] }> {
    const response = await fetch(`/search/suggestions.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${limit}`, fetchConfig('json'));
    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    return response.json();
  }

  /**
   * Get product recommendations
   */
  static async getRecommendations(productId: number, limit: number = 4): Promise<ProductResponse[]> {
    const response = await fetch(`/recommendations/products.json?product_id=${productId}&limit=${limit}`, fetchConfig('json'));
    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }
    const data = await response.json();
    return data.products || [];
  }
}

/**
 * Decorator to handle product operations on a method
 * @param operation The product operation to perform
 */
export function ProductOperation(operation: keyof typeof ProductAPI) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Perform the product operation
        const result = await (ProductAPI[operation] as any)(...args);
        // Call the original method with the result
        return originalMethod.call(this, result, ...args);
      } catch (error) {
        console.error(`Product operation ${operation} failed:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for getting a product
 */
export function GetProduct(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return ProductOperation('getProduct')(target, propertyKey, descriptor);
}

/**
 * Decorator for getting multiple products
 */
export function GetProducts(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return ProductOperation('getProducts')(target, propertyKey, descriptor);
}

/**
 * Decorator for searching products
 */
export function SearchProducts(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return ProductOperation('searchProducts')(target, propertyKey, descriptor);
}

/**
 * Decorator for getting product recommendations
 */
export function GetRecommendations(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return ProductOperation('getRecommendations')(target, propertyKey, descriptor);
}
