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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const audit_service_1 = require("../common/audit.service");
let ReservationsService = class ReservationsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    overlaps(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && aEnd > bStart;
    }
    async create(dto) {
        const item = await this.prisma.item.findUnique({
            where: { id: dto.itemId },
        });
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        const start = new Date(dto.start);
        const end = new Date(dto.end);
        if (!(start < end))
            throw new common_1.BadRequestException('Invalid interval');
        const [loans, res] = await Promise.all([
            this.prisma.loan.findMany({
                where: { itemId: item.id, returnedAt: null },
            }),
            this.prisma.reservation.findMany({
                where: { itemId: item.id, status: 'APPROVED' },
            }),
        ]);
        for (const l of loans) {
            const lEnd = l.returnedAt ?? l.dueAt;
            if (this.overlaps(start, end, l.issuedAt, lEnd))
                throw new common_1.BadRequestException('Item is on loan');
        }
        for (const r of res) {
            if (this.overlaps(start, end, r.startAt, r.endAt))
                throw new common_1.BadRequestException('Time slot not available');
        }
        const created = await this.prisma.reservation.create({
            data: {
                itemId: item.id,
                startAt: start,
                endAt: end,
                status: 'APPROVED',
                note: dto.note,
                userName: dto.userName ?? 'user',
            },
        });
        await this.audit.log(item.id, 'RESERVATION_CREATE', dto.userName ?? 'user');
        return created;
    }
    toDateDayStart(yyyyMmDd) {
        return new Date(`${yyyyMmDd}T00:00:00.000Z`);
    }
    async list(q) {
        const skip = q.page * q.pageSize;
        const take = q.pageSize;
        const AND = [];
        if (q.status)
            AND.push({ status: q.status });
        if (q.from || q.to) {
            const start = q.from ? this.toDateDayStart(q.from) : undefined;
            const end = q.to ? this.toDateDayStart(q.to) : undefined;
            if (start && end && !(start < end))
                throw new common_1.BadRequestException('Invalid range');
            const cond = [];
            if (end)
                cond.push({ startAt: { lt: end } });
            if (start)
                cond.push({ endAt: { gt: start } });
            if (cond.length)
                AND.push({ AND: cond });
        }
        const OR = [];
        if (q.search) {
            const s = q.search;
            OR.push({ userName: { contains: s, mode: 'insensitive' } }, { note: { contains: s, mode: 'insensitive' } }, { item: { name: { contains: s, mode: 'insensitive' } } }, { item: { inventoryNo: { contains: s, mode: 'insensitive' } } });
        }
        const where = {};
        if (AND.length)
            where.AND = AND;
        if (OR.length)
            where.OR = OR;
        const dir = q.sortDir ?? 'asc';
        let orderBy = { startAt: dir };
        switch (q.sortBy) {
            case 'endAt':
                orderBy = { endAt: dir };
                break;
            case 'status':
                orderBy = { status: dir };
                break;
            case 'itemName':
                orderBy = { item: { name: dir } };
                break;
        }
        const [rows, total] = await Promise.all([
            this.prisma.reservation.findMany({
                where,
                include: {
                    item: { select: { id: true, name: true, inventoryNo: true } },
                },
                orderBy,
                skip,
                take,
            }),
            this.prisma.reservation.count({ where }),
        ]);
        const data = rows.map((r) => ({
            id: r.id,
            itemId: r.itemId,
            itemName: r.item?.name ?? '',
            inventoryNo: r.item?.inventoryNo ?? '',
            userName: r.userName ?? null,
            startAt: r.startAt.toISOString(),
            endAt: r.endAt.toISOString(),
            status: r.status,
            note: r.note ?? null,
        }));
        return { data, total };
    }
    async approve(id) {
        const r = await this.prisma.reservation.findUnique({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException('Reservation not found');
        if (r.status === 'CANCELLED')
            throw new common_1.BadRequestException('Cancelled reservation cannot be approved');
        const [loans, res] = await Promise.all([
            this.prisma.loan.findMany({ where: { itemId: r.itemId } }),
            this.prisma.reservation.findMany({
                where: { itemId: r.itemId, status: 'APPROVED', id: { not: r.id } },
            }),
        ]);
        for (const l of loans) {
            const lEnd = l.returnedAt ?? l.dueAt;
            if (!lEnd)
                continue;
            if (this.overlaps(r.startAt, r.endAt, l.issuedAt, lEnd)) {
                throw new common_1.BadRequestException('Item is on loan in that period');
            }
        }
        for (const o of res) {
            if (this.overlaps(r.startAt, r.endAt, o.startAt, o.endAt)) {
                throw new common_1.BadRequestException('Time slot not available');
            }
        }
        await this.prisma.reservation.update({
            where: { id },
            data: { status: 'APPROVED' },
        });
        await this.audit?.log(r.itemId, 'RESERVATION_APPROVE', r.userName ?? 'user');
    }
    async cancel(id) {
        const r = await this.prisma.reservation.findUnique({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException('Reservation not found');
        await this.prisma.reservation.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
        await this.audit?.log(r.itemId, 'RESERVATION_CANCEL', r.userName ?? 'user');
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map