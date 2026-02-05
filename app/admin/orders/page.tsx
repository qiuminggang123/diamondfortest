'use client';

import { useState, useEffect } from 'react';
import { useAuthStatus } from '@/lib/useAuthStatus';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/uiStore';
import Header from '@/components/Header'; // 导入Header组件
import { Package, Truck, Check } from 'lucide-react';

export default function AdminOrdersPage() {
  const { user, status } = useAuthStatus();
  const { setShowLogin, showToast } = useUIStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // 跳转到首页并加上参数以弹出登录框
      router.push('/?showLogin=1');
      return;
    }

    // 检查是否为管理员
    if (status === 'authenticated' && user?.email) {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (adminEmail && user.email !== adminEmail) {
        // 如果不是管理员，跳转到首页
        router.push('/');
        showToast('You do not have permission to access the admin page', 'error');
        return;
      }
    }

    if (status === 'authenticated' && user) {
      loadOrders();
    }
  }, [status, user, router, showToast]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/order');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      
      if (data.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        if (res.status === 401) {
          alert('Insufficient permissions or session expired. Please confirm you are an administrator and refresh the page to try again');
        } else {
          alert(data.message || 'Failed to update order status');
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Network error, failed to update order status');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (!user) {
    // 不再跳转，等待用户登录
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-14">
      <Header /> {/* 添加Header组件 */}
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" /> 订单管理
          </h1>

          {loading ? (
            <div className="text-center py-10">
              <p>正在加载订单...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">暂无订单</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总价</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收货信息</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下单时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.user?.name || order.user?.email || '未知用户'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{order.totalPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {order.status === 'PENDING' ? '待发货' : '已发货'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div>姓名: {order.contactName || '未提供'}</div>
                        <div>电话: {order.contactPhone || '未提供'}</div>
                        <div className="truncate" title={order.shippingAddress || ''}>地址: {order.shippingAddress || '未提供'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.status === 'PENDING' ? (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                          >
                            <Truck className="w-4 h-4" /> 标记为已发货
                          </button>
                        ) : (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'PENDING')}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" /> 标记为待发货
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}