-- 手动添加订单数量字段到数据库
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "quantity" INTEGER DEFAULT 1;