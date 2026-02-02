"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIXELS_PER_MM = exports.OrderStatus = void 0;
// 订单状态枚举
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["SHIPPED"] = "SHIPPED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// 3.78px per mm ~= 96dpi (Standard Screen 1:1)
// Previous value was 5, which made beads look ~30% larger than real life
exports.PIXELS_PER_MM = 3.78;
