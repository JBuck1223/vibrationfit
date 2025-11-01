# Update Intensive 2pay/3pay to 28-Day Billing

## Why This Change?

Stripe checkout doesn't support different billing intervals in the same subscription. To allow both Intensive (2pay/3pay) and Vision Pro 28-day to be in the same checkout, they need to share the same billing interval.

## Required Changes in Stripe Dashboard

### Update Product 2: Vision Activation Intensive - 2-Pay

1. Go to Stripe Dashboard → Products
2. Find "Vision Activation Intensive - 2 Payments"
3. Edit the price
4. Change billing period from "Monthly" to "Custom"
5. Enter: **28 days** (or "Every 28 days")
6. Save changes

### Update Product 3: Vision Activation Intensive - 3-Pay

1. Go to Stripe Dashboard → Products
2. Find "Vision Activation Intensive - 3 Payments"
3. Edit the price
4. Change billing period from "Monthly" to "Custom"
5. Enter: **28 days** (or "Every 28 days")
6. Save changes

## Impact

- **2-Pay Plan:** $249.50 every 28 days × 2 payments = $499 total (over 56 days)
- **3-Pay Plan:** $166.33 every 28 days × 3 payments = $499 total (over 84 days)
- Both can now be in the same checkout as Vision Pro 28-day (also 28-day interval)

## Note

The `iterations` in the subscription schedule still control how many times each plan charges (2 or 3), so the total remains $499 regardless of the interval.

