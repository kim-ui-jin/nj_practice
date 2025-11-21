import { OrderStatus } from "src/common/enums/order-status.enum";

export type CartItem = {
    cartSeq: number;
    quantity: number;
    productSeq: number;
    name: string;
    price: number;
    thumbnailUrl: string | null;
    lineTotal: number;
}

export type OrderPreview = {
    cartItems: CartItem[];
    itemsTotal: number;
    shippingFee: number;
    orderTotal: number;
}

export type OrderSummary = {
    orderNumber: string;
    itemsTotal: number;
    shippingFee: number;
    orderTotal: number;
    receiverName: string;
    receiverPhone: string;
    address1: string;
    address2: string | null;
    memo: string | null;
    pgProvider: string | null;
    createdAt: Date;
    paidAt: Date | null;
    itemSeq: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

export type Items = {
    itemSeq: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}

export type GetCompleteOrder = {
    orderNumber: string;
    itemsTotal: number;
    shippingFee: number;
    orderTotal: number;
    receiverName: string;
    receiverPhone: string;
    address1: string;
    address2: string | null;
    memo: string | null;
    pgProvider: string | null;
    createdAt: Date;
    paidAt: Date | null;
    items: Items[];
}

export type ConfirmOrder = {
    orderNumber: string;
    status: OrderStatus;
    amount: number;
    payment: any;
}