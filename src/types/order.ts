
import { OrderItem } from "./order-item";

export interface Order {
    id: number;
    orderItems: OrderItem[];
    image: string;
    name: string;
    address: string;
    phone: string;
}