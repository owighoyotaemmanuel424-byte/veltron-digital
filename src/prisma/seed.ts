import { PrismaClient } from "@prisma/client";
import { demoCatalog, catalogCategories } from "../lib/demo/catalog";

const prisma = new PrismaClient();

async function main() {
  let count = 0;
  for (const product of demoCatalog) {
    await prisma.product.upsert({
      where: { category_slug: { category: product.category, slug: product.slug } },
      update: {
        name: product.name,
        description: product.description,
        price: product.price.amount,
        currency: product.price.currency,
        interval: product.price.interval,
        active: true,
        metadata: {
          tagline: product.tagline,
          icon: product.icon,
          features: product.features,
          fulfillment: product.fulfillment,
          demoStatus: product.status,
          requiresKyc: product.requiresKyc ?? false,
        },
      },
      create: {
        category: product.category,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price.amount,
        currency: product.price.currency,
        interval: product.price.interval,
        active: true,
        metadata: {
          tagline: product.tagline,
          icon: product.icon,
          features: product.features,
          fulfillment: product.fulfillment,
          demoStatus: product.status,
          requiresKyc: product.requiresKyc ?? false,
        },
      },
    });
    count += 1;
  }
  const seeded = await prisma.product.count({ where: { active: true } });
  console.info(`Catalog seed complete: upserted ${count} demo products across ${catalogCategories.length} verticals. Active products in DB: ${seeded}.`);
  if (count !== demoCatalog.length || seeded < demoCatalog.length) {
    throw new Error(`Catalog seed mismatch: expected at least ${demoCatalog.length} active products, upserted ${count}, found ${seeded}.`);
  }
}

main()
  .catch((error) => {
    console.error("Catalog seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
