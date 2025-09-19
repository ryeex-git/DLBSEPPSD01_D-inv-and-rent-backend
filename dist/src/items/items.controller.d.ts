import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto } from './dto/create-item.dto';
import { AuditService } from '../common/audit.service';
import { ListItemsDto } from './dto/list-items.dto';
export declare class ItemsController {
    private svc;
    private audit;
    constructor(svc: ItemsService, audit: AuditService);
    list(q: ListItemsDto): Promise<{
        data: {
            id: number;
            name: string;
            inventoryNo: string;
            status: import("@prisma/client").$Enums.ItemStatus;
            category: {
                id: number;
                name: string;
            } | null;
        }[];
        total: number;
    }>;
    get(id: number): Promise<{
        category: {
            id: number;
            name: string;
        } | null;
    } & {
        id: number;
        name: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        inventoryNo: string;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    create(dto: CreateItemDto): Promise<{
        id: number;
        name: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        inventoryNo: string;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    update(id: number, dto: UpdateItemDto): Promise<{
        id: number;
        name: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        inventoryNo: string;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        inventoryNo: string;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    history(id: number): Promise<{
        id: number;
        itemId: number;
        action: string;
        actor: string | null;
        ts: Date;
    }[]>;
    getAvailability(id: number, from?: string, to?: string): Promise<({
        start: string;
        end: string;
        type: "LOAN";
        status: string | undefined;
        label: string;
    } | {
        start: string;
        end: string;
        type: "RESERVATION";
        status: "APPROVED" | "CANCELLED" | "PENDING" | undefined;
        label: string;
    })[]>;
}
