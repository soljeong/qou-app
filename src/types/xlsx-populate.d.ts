declare module "xlsx-populate" {
    interface Workbook {
        outputAsync(options?: { password?: string }): Promise<Buffer>;
    }
    function fromDataAsync(data: Buffer | ArrayBuffer, options?: { password?: string }): Promise<Workbook>;
}
