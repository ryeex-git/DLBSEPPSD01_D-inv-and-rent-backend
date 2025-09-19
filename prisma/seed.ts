/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.upsert({
    where: { name: 'Allgemein' },
    update: {},
    create: { name: 'Allgemein' },
  });

  const items = [
    { name: 'Akkuschrauber', inventoryNo: 'INV-1001', categoryId: cat.id },
    { name: 'Lötstation', inventoryNo: 'INV-1010', categoryId: cat.id },
    { name: 'Kamera', inventoryNo: 'INV-2001', categoryId: cat.id },
  ];

  await prisma.$transaction(
    items.map((data) =>
      prisma.item.upsert({
        where: { inventoryNo: data.inventoryNo }, // UNIQUE
        update: {}, // nichts ändern, falls schon vorhanden
        create: data,
      }),
    ),
  );

  console.log('Seed done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
