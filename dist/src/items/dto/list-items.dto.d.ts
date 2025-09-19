export declare class ListItemsDto {
    page: number;
    pageSize: number;
    sortBy?: 'name' | 'status' | 'categoryName';
    sortDir?: 'asc' | 'desc';
    search?: string;
    categoryId?: number;
    status?: 'OK' | 'DEFECT' | 'OUT';
}
