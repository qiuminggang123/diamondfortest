import Link from 'next/link';

export default function AdminHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white z-50 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
        {/* 返回首页按钮 */}
        <Link href="/" className="p-2" title="返回首页">
          <span className="text-base font-medium text-black">返回首页</span>
        </Link>
      </div>
      <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-cinzel), serif' }}>AURA LOOP 管理后台</h1>
      <div className="w-8" /> {/* 占位，保持布局对齐 */}
    </header>
  );
}
