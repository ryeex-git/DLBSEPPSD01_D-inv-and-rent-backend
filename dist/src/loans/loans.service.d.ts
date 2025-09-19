import { PrismaService } from '../common/prisma.service';
import { IssueLoanDto } from './dto/issue-load.dto';
import { ReturnLoanDto } from './dto/return-load.dto';
import { AuditService } from '../common/audit.service';
export declare class LoansService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private overlaps;
    issue(dto: IssueLoanDto): Promise<{
        id: number;
        itemId: number;
        userName: string | null;
        issuedAt: Date;
        dueAt: Date;
        returnedAt: Date | null;
        note: string | null;
    }>;
    returnItem(dto: ReturnLoanDto): Promise<{
        ok: boolean;
        loanId: number;
        returnedAt: Date | null;
    }>;
}
