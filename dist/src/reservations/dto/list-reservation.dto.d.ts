export declare class ListReservationsDto {
    page: number;
    pageSize: number;
    sortBy?: 'startAt' | 'endAt' | 'status' | 'itemName';
    sortDir?: 'asc' | 'desc';
    search?: string;
    status?: 'PENDING' | 'APPROVED' | 'CANCELLED';
    from?: string;
    to?: string;
}
