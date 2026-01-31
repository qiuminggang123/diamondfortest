'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/uiStore';
import { useAuthStatus } from '@/lib/useAuthStatus';
import Header from '@/components/Header'; // 导入Header组件

export default function MyOrdersPage() {
  const { isLoggedIn, status } = useAuthStatus();
  const { setShowLogin } = useUIStore();
  const router = useRouter();

  // 已由下方的 useEffect 统一处理，移除重复逻辑

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      setShowLogin(true);
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router, setShowLogin]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/order');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    // 不再跳转，等待用户登录
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-14"> {/* 添加pt-14为Header留出空间 */}
      <Header /> {/* 添加Header组件 */}
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">我的订单</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">订单编号</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">状态</p>
                    <p className={`font-medium ${
                      order.status === 'PENDING' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {order.status === 'PENDING' ? '待发货' : '已发货'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">总价</p>
                    <p className="font-medium">¥{order.totalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">下单时间</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">收货信息</p>
                  <p className="font-medium">{order.contactName} {order.contactPhone}</p>
                  <p className="font-medium">{order.shippingAddress}</p>
                </div>
                
                {order.design && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">设计信息</p>
                    <p className="font-medium">{order.design.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}