export class BaseResponseDto<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errorCode?: string;
}