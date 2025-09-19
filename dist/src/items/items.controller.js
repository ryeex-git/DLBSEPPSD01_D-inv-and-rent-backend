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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsController = void 0;
const common_1 = require("@nestjs/common");
const items_service_1 = require("./items.service");
const create_item_dto_1 = require("./dto/create-item.dto");
const admin_pin_guard_1 = require("../common/admin-pin.guard");
const audit_service_1 = require("../common/audit.service");
const list_items_dto_1 = require("./dto/list-items.dto");
let ItemsController = class ItemsController {
    svc;
    audit;
    constructor(svc, audit) {
        this.svc = svc;
        this.audit = audit;
    }
    list(q) {
        return this.svc.list(q);
    }
    get(id) {
        return this.svc.get(id);
    }
    async create(dto) {
        const it = await this.svc.create(dto);
        await this.audit.log(it.id, 'ITEM_CREATE', 'admin');
        return it;
    }
    async update(id, dto) {
        const it = await this.svc.update(id, dto);
        await this.audit.log(id, 'ITEM_UPDATE', 'admin');
        return it;
    }
    async remove(id) {
        await this.audit.log(id, 'ITEM_DELETE', 'admin');
        return this.svc.remove(id);
    }
    history(id) {
        return this.svc.history(id);
    }
    async getAvailability(id, from, to) {
        if (!from || !to)
            throw new common_1.BadRequestException('Query "from" und "to" sind erforderlich (YYYY-MM-DD).');
        const exists = await this.svc.exists(id);
        if (!exists)
            throw new common_1.NotFoundException('Item not found');
        return this.svc.getAvailability(id, from, to);
    }
};
exports.ItemsController = ItemsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_items_dto_1.ListItemsDto]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(admin_pin_guard_1.AdminPinGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_item_dto_1.CreateItemDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(admin_pin_guard_1.AdminPinGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_item_dto_1.UpdateItemDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(admin_pin_guard_1.AdminPinGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "getAvailability", null);
exports.ItemsController = ItemsController = __decorate([
    (0, common_1.Controller)('items'),
    __metadata("design:paramtypes", [items_service_1.ItemsService,
        audit_service_1.AuditService])
], ItemsController);
//# sourceMappingURL=items.controller.js.map