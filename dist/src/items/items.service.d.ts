import { PrismaService } from '../common/prisma.service';
import { CreateItemDto, UpdateItemDto } from './dto/create-item.dto';
export declare class ItemsService {
    private prisma;
    constructor(prisma: PrismaService);
    exists(id: number): Promise<boolean>;
    getAvailability(itemId: number, from: string, to: string): Promise<({
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
    list(q: {
        page: number;
        pageSize: number;
        sortBy?: 'name' | 'status' | 'categoryName';
        sortDir?: 'asc' | 'desc';
        search?: string;
        categoryId?: number;
        status?: 'OK' | 'DEFECT' | 'OUT';
    }): Promise<{
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
        inventoryNo: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    create(dto: CreateItemDto): Promise<{
        id: number;
        name: string;
        inventoryNo: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    update(id: number, dto: UpdateItemDto): Promise<{
        id: number;
        name: string;
        inventoryNo: string;
        status: import("@prisma/client").$Enums.ItemStatus;
        condition: string;
        categoryId: number | null;
        tagsCsv: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        inventoryNo: string;
        status: import("@prisma/client").$Enums.ItemStatus;
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
}
