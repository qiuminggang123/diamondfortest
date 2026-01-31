import { Bead as PrismaBead } from "@prisma/client";

// Extend Prisma's Bead type to add client-side properties
export interface BeadType {
  id: string;
  name: string;
  image: string;
  type: string; // category id
  size: number; // in mm
  price: number;
  dominantColor?: string; // Optional: Calculated dominant color for UI
}

// Additional client-side properties not stored in DB
export interface Bead extends BeadType {
  instanceId: string;
  x?: number; // Calculated position for rendering (optional in store)
  y?: number;
  rotation?: number;
}

// Design stored in DB
export interface Design {
  id: string;
  name: string;
  userId: string;
  beads: Bead[];
  thumb?: string;
  circumference?: number;
  createdAt: string;
  updatedAt: string;
}

// Category
export interface Category {
  id: string;
  name: string;
}

// Address
export interface Address {
  id: string;
  userId: string;
  contactName: string;
  contactPhone: string;
  country: string;
  province: string;
  city: string;
  detail: string;
  postalCode: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order
export interface Order {
  id: string;
  userId: string;
  designId?: string;
  totalPrice: number;
  status: 'PENDING' | 'SHIPPED';
  shippingAddress: string; // 合并地址字段
  contactName: string;    // 收货人姓名
  contactPhone: string;   // 收货人电话
  createdAt: string;
  updatedAt: string;
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
}

// 3.78px per mm ~= 96dpi (Standard Screen 1:1)
// Previous value was 5, which made beads look ~30% larger than real life
export const PIXELS_PER_MM = 3.78;