import { PrismaService } from './prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(itemId: number, action: string, actor?: string): Promise<void>;
}
