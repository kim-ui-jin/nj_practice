import { User } from "../entity/user.entity";

export type GetMyInfo = {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
};

export type SafeUser = Omit<User, 'userPassword'>;