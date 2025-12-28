/**
 * Cart Store for POS functionality
 * Manages cart state, items, and calculations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { POSProduct, CartItem, Cart, CartTotals, Customer, HeldCart } from '../types';

interface CartState {
  // Current cart
  cart: Cart;
  // Held carts for later
  heldCarts: HeldCart[];

  // Item actions
  addItem: (product: POSProduct, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setItemDiscount: (itemId: string, discount: number, type: 'fixed' | 'percentage') => void;
  setItemNotes: (itemId: string, notes: string | null) => void;

  // Cart actions
  setCustomer: (customer: Customer | null) => void;
  setCartDiscount: (discount: number, type: 'fixed' | 'percentage') => void;
  setCartNotes: (notes: string | null) => void;
  clearCart: () => void;

  // Hold/Recall
  holdCart: (name: string) => void;
  recallCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;

  // Calculations
  getTotals: () => CartTotals;
}

// Create empty cart
const createEmptyCart = (): Cart => ({
  id: uuidv4(),
  items: [],
  customer: null,
  discount: 0,
  discount_type: 'fixed',
  notes: null,
  created_at: new Date(),
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: createEmptyCart(),
      heldCarts: [],

      // Add item to cart
      addItem: (product: POSProduct, quantity = 1) => {
        set((state) => {
          // Check if product already in cart
          const existingItem = state.cart.items.find(
            (item) => item.product.id === product.id
          );

          if (existingItem) {
            // Update quantity
            return {
              cart: {
                ...state.cart,
                items: state.cart.items.map((item) =>
                  item.id === existingItem.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              },
            };
          }

          // Add new item
          const newItem: CartItem = {
            id: uuidv4(),
            product,
            quantity,
            unit_price: product.sale_price,
            discount: 0,
            discount_type: 'fixed',
            notes: null,
          };

          return {
            cart: {
              ...state.cart,
              items: [...state.cart.items, newItem],
            },
          };
        });
      },

      // Update item quantity
      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          },
        }));
      },

      // Remove item
      removeItem: (itemId: string) => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.filter((item) => item.id !== itemId),
          },
        }));
      },

      // Set item discount
      setItemDiscount: (itemId: string, discount: number, type: 'fixed' | 'percentage') => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.map((item) =>
              item.id === itemId ? { ...item, discount, discount_type: type } : item
            ),
          },
        }));
      },

      // Set item notes
      setItemNotes: (itemId: string, notes: string | null) => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.map((item) =>
              item.id === itemId ? { ...item, notes } : item
            ),
          },
        }));
      },

      // Set customer
      setCustomer: (customer: Customer | null) => {
        set((state) => ({
          cart: { ...state.cart, customer },
        }));
      },

      // Set cart discount
      setCartDiscount: (discount: number, type: 'fixed' | 'percentage') => {
        set((state) => ({
          cart: { ...state.cart, discount, discount_type: type },
        }));
      },

      // Set cart notes
      setCartNotes: (notes: string | null) => {
        set((state) => ({
          cart: { ...state.cart, notes },
        }));
      },

      // Clear cart
      clearCart: () => {
        set({ cart: createEmptyCart() });
      },

      // Hold current cart
      holdCart: (name: string) => {
        const { cart, heldCarts } = get();
        
        if (cart.items.length === 0) return;

        const heldCart: HeldCart = {
          id: uuidv4(),
          name,
          cart: { ...cart },
          held_at: new Date(),
        };

        set({
          heldCarts: [...heldCarts, heldCart],
          cart: createEmptyCart(),
        });
      },

      // Recall held cart
      recallCart: (id: string) => {
        const { heldCarts, cart } = get();
        const heldCart = heldCarts.find((h) => h.id === id);

        if (!heldCart) return;

        // If current cart has items, hold it first
        if (cart.items.length > 0) {
          get().holdCart(`Previous Cart`);
        }

        set({
          cart: { ...heldCart.cart, id: uuidv4() },
          heldCarts: heldCarts.filter((h) => h.id !== id),
        });
      },

      // Delete held cart
      deleteHeldCart: (id: string) => {
        set((state) => ({
          heldCarts: state.heldCarts.filter((h) => h.id !== id),
        }));
      },

      // Calculate totals
      getTotals: (): CartTotals => {
        const { cart } = get();

        // Calculate item totals
        let subtotal = 0;
        let itemDiscount = 0;
        let itemsCount = 0;

        for (const item of cart.items) {
          const lineTotal = item.unit_price * item.quantity;
          subtotal += lineTotal;
          itemsCount += item.quantity;

          // Item discount
          if (item.discount > 0) {
            if (item.discount_type === 'percentage') {
              itemDiscount += lineTotal * (item.discount / 100);
            } else {
              itemDiscount += item.discount * item.quantity;
            }
          }
        }

        // Cart discount
        let cartDiscount = 0;
        if (cart.discount > 0) {
          if (cart.discount_type === 'percentage') {
            cartDiscount = (subtotal - itemDiscount) * (cart.discount / 100);
          } else {
            cartDiscount = cart.discount;
          }
        }

        const totalDiscount = itemDiscount + cartDiscount;
        const grandTotal = subtotal - totalDiscount;

        return {
          subtotal,
          discount_amount: totalDiscount,
          tax_amount: 0,
          grand_total: grandTotal,
          items_count: cart.items.length,
          total_items: itemsCount,
        };
      },
    }),
    {
      name: 'pos-cart',
      partialize: (state) => ({
        heldCarts: state.heldCarts,
      }),
    }
  )
);
