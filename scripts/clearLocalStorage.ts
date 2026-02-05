/**
 * localStorage 清理脚本
 * 用于解决 QuotaExceededError 问题
 */

// 在浏览器控制台运行此脚本

console.log('=== Diamond2 localStorage 清理工具 ===');

// 显示当前存储使用情况
console.log('\n当前存储项:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('diamond-store')) {
    const size = localStorage.getItem(key)?.length || 0;
    console.log(`- ${key}: ${Math.round(size / 1024)} KB`);
  }
});

// 清理所有 diamond-store 相关数据
console.log('\n正在清理存储数据...');
let cleanedCount = 0;

Object.keys(localStorage).forEach(key => {
  if (key.includes('diamond-store')) {
    localStorage.removeItem(key);
    cleanedCount++;
  }
});

console.log(`已清理 ${cleanedCount} 个存储项`);

// 显示清理后的状态
console.log('\n清理完成！请刷新页面重新加载应用。');

// 可选：显示剩余存储空间
try {
  const remainingSpace = 5120 - JSON.stringify(localStorage).length / 1024; // 估算剩余空间(KB)
  console.log(`估算剩余存储空间: ${Math.max(0, Math.round(remainingSpace))} KB`);
} catch (e) {
  console.log('无法计算剩余存储空间');
}