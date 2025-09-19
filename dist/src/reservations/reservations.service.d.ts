import { PrismaService } from '../common/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AuditService } from '../common/audit.service';
export declare class ReservationsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private overlaps;
    create(dto: CreateReservationDto): Promise<{
        id: number;
        status: import("@prisma/client").$Enums.ReservationStatus;
        itemId: number;
        userName: string | null;
        note: string | null;
        startAt: Date;
        endAt: Date;
        createdAt: Date;
    }>;
    private toDateDayStart;
    list(q: {
        page: number;
        pageSize: number;
        sortBy?: string;
        sortDir?: 'asc' | 'desc';
        search?: string;
        status?: 'PENDING' | 'APPROVED' | 'CANCELLED';
        from?: string;
        to?: string;
    }): Promise<{
        data: {
            id: number;
            itemId: number;
            itemName: string;
            inventoryNo: string;
            userName: string | null;
            startAt: string;
            endAt: string;
            status: "PENDING" | "APPROVED" | "CANCELLED";
            note: string | null;
        }[];
        total: number;
    }>;
    approve(id: number): Promise<void>;
    cancel(id: number): Promise<void>;
}
