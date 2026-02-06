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

  /**
   * Update cart items
   */
  static async updateCart(updates: Record<string, number>): Promise<CartResponse> {
    const response = await fetch('/cart/update.js', fetchConfig('json', { body: JSON.stringify({ updates }) }));
    if (!response.ok) {
      throw new Error('Failed to update cart');
    }
    return response.json();
  }

  /**
   * Change cart item
   */
  static async changeCart(changes: { id: number; quantity: number }): Promise<CartResponse> {
    const response = await fetch('/cart/change.js', fetchConfig('json', { body: JSON.stringify(changes) }));
    if (!response.ok) {
      throw new Error('Failed to change cart item');
    }
    return response.json();
  }

  /**
   * Clear cart
   */
  static async clearCart(): Promise<CartResponse> {
    const response = await fetch('/cart/clear.js', fetchConfig('json'));
    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }
    return response.json();
  }

  /**
   * Get cart count
   */
  static async getCartCount(): Promise<number> {
    const cart = await this.getCart();
    return cart.item_count;
  }
}

/**
 * Decorator to handle cart operations on a method
 * @param operation The cart operation to perform
 */
export function CartOperation(operation: keyof typeof CartAPI) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Perform the cart operation
        const result = await (CartAPI[operation] as any)(...args);
        // Call the original method with the result
        return originalMethod.call(this, result, ...args);
      } catch (error) {
        console.error(`Cart operation ${operation} failed:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for adding to cart
 */
export function AddToCart(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return CartOperation('addToCart')(target, propertyKey, descriptor);
}

/**
 * Decorator for updating cart
 */
export function UpdateCart(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return CartOperation('updateCart')(target, propertyKey, descriptor);
}

/**
 * Decorator for getting cart
 */
export function GetCart(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return CartOperation('getCart')(target, propertyKey, descriptor);
}
