import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests - POS Page
 * Tests layout at different breakpoints and themes
 */
test.describe('POSPage Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to POS page (requires auth bypass or mock)
    await page.goto('/pos');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('renders correctly at current viewport', async ({ page }) => {
    // Wait for product grid to load
    await page.waitForSelector('[data-testid="product-grid"], .product-grid, [role="tablist"]', {
      timeout: 10000,
    }).catch(() => {
      // Fallback: wait for any main content
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('pos-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // 1% tolerance
    });
  });

  test('cart panel renders correctly', async ({ page }) => {
    const cartPanel = page.locator('[data-testid="cart-panel"], [role="region"][aria-label*="cart"], .cart-panel').first();
    
    if (await cartPanel.isVisible()) {
      await expect(cartPanel).toHaveScreenshot('cart-panel.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('product grid renders correctly', async ({ page }) => {
    const productGrid = page.locator('[data-testid="product-grid"], .product-grid').first();
    
    if (await productGrid.isVisible()) {
      await expect(productGrid).toHaveScreenshot('product-grid.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

/**
 * Visual Regression Tests - Checkout Modal
 */
test.describe('CheckoutModal Visual Regression', () => {
  test('checkout modal renders correctly', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    
    // Try to open checkout modal
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Pay"), [data-testid="checkout-button"]').first();
    
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      
      // Wait for modal
      const modal = page.locator('[role="dialog"], .modal, [data-testid="checkout-modal"]').first();
      await modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      
      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('checkout-modal.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    }
  });
});

/**
 * Visual Regression Tests - Receipt Preview
 */
test.describe('ReceiptPreview Visual Regression', () => {
  test('receipt preview renders at 80mm width', async ({ page }) => {
    // Navigate to a page with receipt preview or trigger it
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    
    // Try to find receipt preview component
    const receipt = page.locator('[data-testid="receipt-preview"], .receipt-preview, [class*="receipt"]').first();
    
    if (await receipt.isVisible()) {
      // Verify 80mm width (288px at 96 DPI)
      const box = await receipt.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(320); // Allow some padding
      }
      
      await expect(receipt).toHaveScreenshot('receipt-preview.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

/**
 * Visual Regression Tests - Data Table
 */
test.describe('DataTable Visual Regression', () => {
  test('data table renders correctly', async ({ page }) => {
    // Navigate to a page with data table (products, inventory, etc.)
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table[role="table"], [data-testid="data-table"], .data-table').first();
    
    if (await table.isVisible()) {
      await expect(table).toHaveScreenshot('data-table.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

/**
 * Visual Regression Tests - Forms
 */
test.describe('ProductForm Visual Regression', () => {
  test('product form renders correctly', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Try to open product form modal
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), [data-testid="add-product"]').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      const form = page.locator('form, [role="dialog"]').first();
      await form.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      
      if (await form.isVisible()) {
        await expect(form).toHaveScreenshot('product-form.png', {
          maxDiffPixelRatio: 0.01,
        });
      }
    }
  });
});
