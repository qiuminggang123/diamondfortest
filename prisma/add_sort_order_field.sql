-- 添加sortOrder字段到Bead表
ALTER TABLE "Bead" 
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- 创建索引以提高排序查询性能
CREATE INDEX IF NOT EXISTS "Bead_sortOrder_idx" ON "Bead" ("sortOrder");

-- 更新现有记录的sortOrder值（如果需要的话）
-- 这里可以根据创建时间或其他逻辑来设置初始排序值
UPDATE "Bead" 
SET "sortOrder" = ROW_NUMBER() OVER (ORDER BY "createdAt") - 1
WHERE "sortOrder" = 0;