import { Menu, Settings, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { useAuthStatus } from '@/lib/useAuthStatus';
import { useStore } from '@/lib/store';
import { useUIStore } from '@/lib/uiStore';
import { useSearchParams, useRouter } from 'next/navigation';


export default function Header() {
  const [navOpen, setNavOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { showConfirm, showToast, setShowLogin, loginModal } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  // 登录状态与登出
  const { isLoggedIn, user, signOut } = useAuthStatus();
  const { beads } = useStore();

  useEffect(() => {
    // 检查URL参数中是否有showLogin=1，如果有则自动打开登录框
    if (searchParams.get('showLogin') === '1' && !isLoggedIn) {
      setShowLogin(true);
      // 清除URL参数，防止重复打开
      const urlWithoutParams = window.location.pathname;
      window.history.replaceState({}, document.title, urlWithoutParams);
    }
  }, [searchParams, isLoggedIn, setShowLogin]);

  // 检查用户是否为管理员
  useEffect(() => {
    if (isLoggedIn && user?.email) {
      // 检查用户邮箱是否与管理员邮箱匹配
      // NEXT_PUBLIC_ 前缀确保环境变量可被客户端访问
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      setIsAdmin(!!adminEmail && user.email === adminEmail);
    } else {
      setIsAdmin(false);
    }
  }, [isLoggedIn, user?.email]);

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white z-50 flex items-center justify-between px-4 shadow-sm">
      {/* 移动端：左侧汉堡按钮 */}
      <div className="flex items-center">
        <button
          className="p-2 rounded hover:bg-gray-100 focus:outline-none block md:hidden"
          title="导航菜单"
          onClick={() => setNavOpen(v => !v)}
        >
          <Menu className="w-6 h-6 text-black" />
        </button>
      </div>

      <img
        src="/logo.png"
        alt="AURA LOOP Logo"
        className="h-10 w-auto mx-auto cursor-pointer"
        style={{ objectFit: 'contain' }}
        onClick={() => router.push('/')}
      />

      {/* 右侧菜单：md及以上显示，移动端隐藏 */}
      <nav className="hidden md:flex items-center gap-4">
        {isLoggedIn && (
          <>
            {/* 只对管理员显示管理后台链接 */}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 text-gray-700 text-base">
                <Settings className="w-5 h-5" />
                <span>管理后台</span>
              </Link>
            )}
            <Link href="/my-designs" className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 text-gray-700 text-base">
              <UserCircle2 className="w-6 h-6" />
              <span>我的设计</span>
            </Link>
            <Link href="/my-orders" className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 text-gray-700 text-base">
              <UserCircle2 className="w-6 h-6" />
              <span>我的订单</span>
            </Link>
            <Link href="/address" className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 text-gray-700 text-base">
              <span className="inline-block w-5 h-5 bg-blue-200 rounded-full text-center text-xs font-bold mr-1">地</span>
              <span>地址管理</span>
            </Link>
          </>
        )}
        {!isLoggedIn ? (
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 rounded hover:bg-blue-100 text-blue-700 text-base" 
              onClick={() => setShowLogin(true)}
            >
              登录
            </button>
            <button 
              className="px-3 py-2 rounded hover:bg-green-100 text-green-700 text-base" 
              onClick={() => setShowLogin(true)}
            >
              注册
            </button>
          </div>
        ) : (
          <button className="px-3 py-2 rounded hover:bg-red-100 text-red-700 text-base" onClick={() => signOut()}>登出</button>
        )}
      </nav>
      {/* 登录弹窗 */}
      <LoginModal open={loginModal.visible} onClose={() => setShowLogin(false)} />

      {/* 移动端：header下方区域菜单，带淡入淡出过渡 */}
      <div className={
        `fixed left-0 right-0 top-14 bottom-0 z-100 md:hidden transition-opacity duration-300 ${navOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
      }>
        {/* 半透明遮罩，点击关闭 */}
        <div
          className="absolute inset-0 bg-black/20"
          onClick={() => setNavOpen(false)}
        />
        {/* 菜单内容 */}
        <nav className={
          `absolute left-0 right-0 top-0 flex flex-col gap-8 items-center pt-10 pb-8 bg-white shadow-lg transition-transform duration-300 ${navOpen ? 'translate-y-0' : '-translate-y-8'}`
        }>
          {isLoggedIn && (
            <>
              {/* 只对管理员显示管理后台链接 */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-6 py-4 rounded text-gray-800 text-xl font-semibold w-4/5 justify-center bg-gray-100 hover:bg-gray-200 transition"
                  onClick={() => setNavOpen(false)}
                >
                  <Settings className="w-7 h-7" />
                  <span>管理后台</span>
                </Link>
              )}
              <Link
                href="/my-designs"
                className="flex items-center gap-2 px-6 py-4 rounded text-gray-800 text-xl font-semibold w-4/5 justify-center bg-gray-100 hover:bg-gray-200 transition"
                onClick={() => setNavOpen(false)}
              >
                <UserCircle2 className="w-8 h-8" />
                <span>我的设计</span>
              </Link>
              <Link
                href="/my-orders"
                className="flex items-center gap-2 px-6 py-4 rounded text-gray-800 text-xl font-semibold w-4/5 justify-center bg-gray-100 hover:bg-gray-200 transition"
                onClick={() => setNavOpen(false)}
              >
                <UserCircle2 className="w-8 h-8" />
                <span>我的订单</span>
              </Link>
              <Link
                href="/address"
                className="flex items-center gap-2 px-6 py-4 rounded text-gray-800 text-xl font-semibold w-4/5 justify-center bg-gray-100 hover:bg-gray-200 transition"
                onClick={() => setNavOpen(false)}
              >
                <span className="inline-block w-7 h-7 bg-blue-200 rounded-full text-center text-base font-bold mr-1">地</span>
                <span>地址管理</span>
              </Link>
              
            </>
          )}
          {!isLoggedIn ? (
            <div className="flex flex-col gap-4 w-4/5">
              <button 
                className="px-6 py-4 rounded bg-blue-100 text-blue-700 text-xl font-semibold" 
                onClick={() => setShowLogin(true)}
              >
                登录
              </button>
              <button 
                className="px-6 py-4 rounded bg-green-100 text-green-700 text-xl font-semibold" 
                onClick={() => setShowLogin(true)}
              >
                注册
              </button>
            </div>
          ) : (
            <button className="px-6 py-4 rounded bg-red-100 text-red-700 text-xl font-semibold w-4/5" onClick={() => signOut()}>登出</button>
          )}
        </nav>
      </div>
    </header>
  );
}