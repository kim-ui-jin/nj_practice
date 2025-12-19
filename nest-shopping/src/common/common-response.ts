export class CommonResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;

    private constructor(
        success: boolean,
        message: string,
        data?: T
    ) {
        this.success = success;
        this.message = message;

        if (data !== undefined) this.data = data;
    }

    static ok<T>(message: string, data?: T): CommonResponse<T> {
        return new CommonResponse<T>(true, message, data);
    }

    static fail(message: string): CommonResponse<void> {
        return new CommonResponse<void>(false, message);
    }
}