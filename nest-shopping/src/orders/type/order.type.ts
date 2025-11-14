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