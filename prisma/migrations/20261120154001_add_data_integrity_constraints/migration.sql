-- ==========================================
-- OrderItem Constraints
-- ==========================================

ALTER TABLE public."OrderItem"
ADD CONSTRAINT "OrderItem_valid_item_type_check"
CHECK (
    ("productId" IS NOT NULL AND "simId" IS NULL)
    OR
    ("productId" IS NULL AND "simId" IS NOT NULL)
);

ALTER TABLE public."OrderItem"
ADD CONSTRAINT "OrderItem_qty_positive_check"
CHECK ("qty" > 0);

ALTER TABLE public."OrderItem"
ADD CONSTRAINT "OrderItem_price_non_negative_check"
CHECK ("price" >= 0);

ALTER TABLE public."OrderItem"
ADD CONSTRAINT "OrderItem_variant_requires_product_check"
CHECK ("variantId" IS NULL OR "productId" IS NOT NULL);


-- ==========================================
-- Payment Constraints
-- ==========================================

ALTER TABLE public."Payment"
ADD CONSTRAINT "Payment_amount_non_negative_check"
CHECK ("amount" >= 0);


-- ==========================================
-- Product Constraints
-- ==========================================

ALTER TABLE public."Product"
ADD CONSTRAINT "Product_price_non_negative_check"
CHECK ("price" >= 0);

ALTER TABLE public."Product"
ADD CONSTRAINT "Product_discount_range_check"
CHECK ("discount" BETWEEN 0 AND 100);

ALTER TABLE public."Product"
ADD CONSTRAINT "Product_stock_non_negative_check"
CHECK ("stock" >= 0);


-- ==========================================
-- ProductVariant Constraints
-- ==========================================

ALTER TABLE public."ProductVariant"
ADD CONSTRAINT "ProductVariant_price_non_negative_check"
CHECK ("price" >= 0);

ALTER TABLE public."ProductVariant"
ADD CONSTRAINT "ProductVariant_discount_range_check"
CHECK ("discount" BETWEEN 0 AND 100);

ALTER TABLE public."ProductVariant"
ADD CONSTRAINT "ProductVariant_stock_non_negative_check"
CHECK ("stock" >= 0);


-- ==========================================
-- SimNumber Constraints
-- ==========================================

ALTER TABLE public."SimNumber"
ADD CONSTRAINT "SimNumber_price_non_negative_check"
CHECK ("price" >= 0);


-- ==========================================
-- Order Constraints
-- ==========================================

ALTER TABLE public."Order"
ADD CONSTRAINT "Order_total_non_negative_check"
CHECK ("total" >= 0);
