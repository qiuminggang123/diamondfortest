import Link from 'next/link';
import { useAuthStatus } from '@/lib/useAuthStatus';

export default function AdminHeader() {
  const { signOut } = useAuthStatus();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/', redirect: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-bold text-gray-800 hover:opacity-80 transition-opacity">
            ← 返回首页
          </Link>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <h1 className="text-lg font-semibold text-gray-700">管理后台</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/admin" 
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            素材管理
          </Link>
          <Link 
            href="/admin/orders" 
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            订单管理
          </Link>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  );
}