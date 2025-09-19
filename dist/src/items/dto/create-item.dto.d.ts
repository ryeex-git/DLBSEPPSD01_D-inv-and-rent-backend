export declare enum ItemStatus {
    OK = "OK",
    DEFECT = "DEFECT",
    OUT = "OUT"
}
export declare class CreateItemDto {
    name: string;
    inventoryNo: string;
    categoryId?: number;
    condition?: string;
    tagsCsv?: string;
}
export declare class UpdateItemDto {
    name?: string;
    condition?: string;
    categoryId?: number;
    status?: ItemStatus;
    tagsCsv?: string;
}
