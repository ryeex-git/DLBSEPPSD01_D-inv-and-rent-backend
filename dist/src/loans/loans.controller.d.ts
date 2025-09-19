import { LoansService } from './loans.service';
import { IssueLoanDto } from './dto/issue-load.dto';
import { ReturnLoanDto } from './dto/return-load.dto';
export declare class LoansController {
    private svc;
    constructor(svc: LoansService);
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
