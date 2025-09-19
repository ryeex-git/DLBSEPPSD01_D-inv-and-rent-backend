import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservation.dto';
export declare class ReservationsController {
    private svc;
    constructor(svc: ReservationsService);
    list(q: ListReservationsDto): Promise<{
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
    approve(id: number): Promise<void>;
    cancel(id: number): Promise<void>;
}
