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
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const audit_service_1 = require("../common/audit.service");
let LoansService = class LoansService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    overlaps(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && aEnd > bStart;
    }
    async issue(dto) {
        const item = await this.prisma.item.findUnique({
            where: { id: dto.itemId },
        });
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        if (item.status === 'OUT')
            throw new common_1.BadRequestException('Item already on loan');
        const issuedAt = new Date();
        const dueAt = new Date(dto.dueAt);
        if (!(issuedAt < dueAt))
            throw new common_1.BadRequestException('Invalid due date');
        const res = await this.prisma.reservation.findMany({
            where: { itemId: item.id, status: 'APPROVED' },
        });
        for (const r of res) {
            if (this.overlaps(issuedAt, dueAt, r.startAt, r.endAt)) {
                throw new common_1.BadRequestException('Conflicts with reservation');
            }
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const loan = await tx.loan.create({
                data: {
                    itemId: item.id,
                    issuedAt,
                    dueAt,
                    note: dto.note,
                    userName: dto.userName ?? 'admin',
                },
            });
            await tx.item.update({ where: { id: item.id }, data: { status: 'OUT' } });
            return loan;
        });
        await this.audit.log(item.id, 'LOAN_ISSUE', dto.userName ?? 'admin');
        return result;
    }
    async returnItem(dto) {
        const item = await this.prisma.item.findUnique({
            where: { id: dto.itemId },
            include: { loans: true },
        });
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        const open = await this.prisma.loan.findFirst({
            where: { itemId: item.id, returnedAt: null },
        });
        if (!open)
            throw new common_1.BadRequestException('No open loan');
        const now = new Date();
        const updatedLoan = await this.prisma.$transaction(async (tx) => {
            const loan = await tx.loan.update({
                where: { id: open.id },
                data: { returnedAt: now },
            });
            await tx.item.update({ where: { id: item.id }, data: { status: 'OK' } });
            return loan;
        });
        await this.audit.log(item.id, 'LOAN_RETURN', 'admin');
        return {
            ok: true,
            loanId: updatedLoan.id,
            returnedAt: updatedLoan.returnedAt,
        };
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], LoansService);
//# sourceMappingURL=loans.service.js.map