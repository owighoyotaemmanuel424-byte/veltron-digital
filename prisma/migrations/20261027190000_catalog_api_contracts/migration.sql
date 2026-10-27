-- Additive catalog/API migration. Existing users, services, orders, payments and audit rows are preserved.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "interval" TEXT NOT NULL DEFAULT 'one-time',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_category_slug_key" ON "Product"("category", "slug");
CREATE INDEX "Product_category_active_idx" ON "Product"("category", "active");

-- Keep the legacy Service relation for existing orders while allowing catalog-only orders.
ALTER TABLE "Order" ALTER COLUMN "serviceId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "productId" TEXT;
ALTER TABLE "Order" ADD COLUMN "config" JSONB;
ALTER TABLE "Order" ADD COLUMN "price" DECIMAL(12,2);
ALTER TABLE "Order" ADD COLUMN "fulfilledAt" TIMESTAMP(3);
CREATE INDEX "Order_productId_createdAt_idx" ON "Order"("productId", "createdAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_orderId_createdAt_idx" ON "Document"("orderId", "createdAt");
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
