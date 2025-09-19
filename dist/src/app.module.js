"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const items_module_1 = require("./items/items.module");
const categories_module_1 = require("./categories/categories.module");
const reservations_module_1 = require("./reservations/reservations.module");
const loans_module_1 = require("./loans/loans.module");
const audit_service_1 = require("./common/audit.service");
const prisma_module_1 = require("./common/prisma.module");
const common_module_1 = require("./common/common.module");
const admin_module_1 = require("./admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            items_module_1.ItemsModule,
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            categories_module_1.CategoriesModule,
            reservations_module_1.ReservationsModule,
            loans_module_1.LoansModule,
            admin_module_1.AdminModule,
        ],
        providers: [audit_service_1.AuditService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map