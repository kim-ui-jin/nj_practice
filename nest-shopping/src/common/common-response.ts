export class CommonResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}