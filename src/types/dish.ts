// import { Category } from "./category";
// import { DishType } from "./dishType";
// import { Restaurant } from "./restaurant";

export interface Dish {
    id: number;
    // restaurant: Restaurant;
    // category: Category;
    name: string;
    price: number;
    description: string;
    imageUrl: string;
    status?: DishStatus;
    // dishType: DishType;
}
export enum DishStatus {
    DELETED = 'DELETED',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CREATED = 'CREATED'
}