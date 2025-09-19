"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let ItemsService = class ItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exists(id) {
        const x = await this.prisma.item.findUnique({
            where: { id },
            select: { id: true },
        });
        return !!x;
    }
    async getAvailability(itemId, from, to) {
        const start = new Date(`${from}T00:00:00.000Z`);
        const end = new Date(`${to}T00:00:00.000Z`);
        if (!(start < end))
            throw new Error('Invalid range');
        const loans = await this.prisma.loan.findMany({
            where: {
                itemId,
                issuedAt: { lt: end },
                OR: [
                    { returnedAt: { gt: start } },
                    { AND: [{ returnedAt: null }, { dueAt: { gt: start } }] },
                ],
            },
            select: {
                issuedAt: true,
                dueAt: true,
                returnedAt: true,
                note: true,
                userName: true,
            },
            orderBy: { issuedAt: 'asc' },
        });
        const reservations = await this.prisma.reservation.findMany({
            where: {
                itemId,
                startAt: { lt: end },
                endAt: { gt: start },
            },
            select: {
                startAt: true,
                endAt: true,
                status: true,
                note: true,
                userName: true,
            },
            orderBy: { startAt: 'asc' },
        });
        const spans = [
            ...loans.map((l) => ({
                start: l.issuedAt.toISOString(),
                end: (l.returnedAt ?? l.dueAt ?? end).toISOString(),
                type: 'LOAN',
                status: l.returnedAt ? 'RETURNED' : undefined,
                label: l.userName ?? l.note ?? 'Ausleihe',
            })),
            ...reservations.map((r) => ({
                start: r.startAt.toISOString(),
                end: r.endAt.toISOString(),
                type: 'RESERVATION',
                status: r.status ??
                    undefined,
                label: r.userName ?? r.note ?? 'Reservierung',
            })),
        ];
        return spans;
    }
    async list(q) {
        const skip = q.page * q.pageSize;
        const take = q.pageSize;
        const AND = [];
        if (q.categoryId)
            AND.push({ categoryId: q.categoryId });
        if (q.status)
            AND.push({ status: q.status });
        if (q.search?.trim()) {
            const terms = q.search.trim().split(/\s+/).filter(Boolean);
            for (const t of terms) {
                AND.push({
                    OR: [
                        { name: { contains: t } },
                        { inventoryNo: { contains: t } },
                        { tagsCsv: { contains: t } },
                        { category: { is: { name: { contains: t } } } },
                    ],
                });
            }
        }
        const where = AND.length ? { AND } : {};
        const dir = q.sortDir ?? 'asc';
        let orderBy = { name: dir };
        switch (q.sortBy) {
            case 'status':
                orderBy = { status: dir };
                break;
            case 'categoryName':
                orderBy = { category: { name: dir } };
                break;
            default:
                orderBy = { name: dir };
        }
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.item.findMany({
                where,
                include: { category: { select: { id: true, name: true } } },
                orderBy,
                skip,
                take,
            }),
            this.prisma.item.count({ where }),
        ]);
        return {
            data: rows.map((r) => ({
                id: r.id,
                name: r.name,
                inventoryNo: r.inventoryNo,
                status: r.status,
                category: r.category
                    ? { id: r.category.id, name: r.category.name }
                    : null,
            })),
            total,
        };
    }
    async get(id) {
        const it = await this.prisma.item.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!it)
            throw new common_1.NotFoundException('Item not found');
        return it;
    }
    async create(dto) {
        return this.prisma.item.create({ data: { ...dto } });
    }
    async update(id, dto) {
        await this.get(id);
        return this.prisma.item.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.get(id);
        return this.prisma.item.delete({ where: { id } });
    }
    async history(id) {
        await this.get(id);
        return this.prisma.auditLog.findMany({
            where: { itemId: id },
            orderBy: { ts: 'desc' },
        });
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemsService);
//# sourceMappingURL=items.service.js.map