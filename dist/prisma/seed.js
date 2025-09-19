"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
    await prisma.$transaction(items.map((data) => prisma.item.upsert({
        where: { inventoryNo: data.inventoryNo },
        update: {},
        create: data,
    })));
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
//# sourceMappingURL=seed.js.map