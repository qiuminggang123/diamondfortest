import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AItem {
  name: string;
  url: string;
}

interface BItem {
  name: string;
  size: string;
  price: string;
  url?: string;
}

// 读取文件
const aData: AItem[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../prisma/a.json'), 'utf-8'));
const bData: BItem[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../prisma/b.json'), 'utf-8'));

// 创建珠子类型到URL的映射
const beadTypeToUrlMap = new Map<string, string>();

aData.forEach(item => {
  // 从文件名中提取珠子类型
  let beadType = '';
  
  // 处理不同的命名格式
  if (item.name.includes('乌拉圭紫水晶')) {
    beadType = '天然紫水晶';
  } else if (item.name.includes('巴西紫水晶')) {
    beadType = '天然紫水晶';
  } else if (item.name.includes('纯净白水晶')) {
    beadType = '天然纯体白水晶';
  } else if (item.name.includes('白水晶')) {
    beadType = '天然纯体白水晶';
  } else if (item.name.includes('7A级金太阳石')) {
    beadType = '天然原矿金太阳石';
  } else if (item.name.includes('彩发晶')) {
    beadType = '天然彩发晶';
  } else if (item.name.includes('葡萄石')) {
    beadType = '天然葡萄石';
  } else if (item.name.includes('蓝晶石')) {
    beadType = '天然蓝晶石';
  } else if (item.name.includes('黑发晶')) {
    beadType = '天然黑发晶';
  } else if (item.name.includes('绿草莓晶')) {
    beadType = '7a绿草莓晶';
  } else if (item.name.includes('马达加斯加粉晶')) {
    beadType = '马达加斯加粉晶';
  }
  
  if (beadType) {
    beadTypeToUrlMap.set(beadType, item.url);
  }
});

console.log('珠子类型到URL映射:');
beadTypeToUrlMap.forEach((url, beadType) => {
  console.log(`${beadType}: ${url}`);
});

// 更新b.json数据
const updatedBData: BItem[] = bData.map(item => {
  const url = beadTypeToUrlMap.get(item.name);
  if (url) {
    return {
      ...item,
      url: url
    };
  }
  return item;
});

// 统计结果
const itemsWithUrl = updatedBData.filter(item => item.url).length;
const itemsWithoutUrl = updatedBData.filter(item => !item.url).length;

console.log(`\n处理结果:`);
console.log(`总项目数: ${updatedBData.length}`);
console.log(`已添加URL的项目数: ${itemsWithUrl}`);
console.log(`未找到匹配URL的项目数: ${itemsWithoutUrl}`);

// 保存更新后的数据
fs.writeFileSync(
  path.join(__dirname, '../prisma/b_updated.json'),
  JSON.stringify(updatedBData, null, 2),
  'utf-8'
);

console.log('\n更新后的数据已保存到 prisma/b_updated.json');

// 显示未匹配的项目
console.log('\n未找到URL匹配的项目:');
updatedBData
  .filter(item => !item.url)
  .forEach(item => {
    console.log(`- ${item.name} (${item.size})`);
  });
