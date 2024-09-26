import { Dish } from "./dish";

export interface OrderItem {
    dish: Dish;
    quantity: number;
}