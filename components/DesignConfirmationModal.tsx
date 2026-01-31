'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUIStore } from '@/lib/uiStore';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '@/lib/useAuthStatus';

interface DesignConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDraft?: boolean;
}

export default function DesignConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isDraft = false 
}: DesignConfirmationModalProps) {
  const { beads, totalPrice, circumference } = useStore();
  const { isLoggedIn, status } = useAuthStatus();
  const { setShowLogin } = useUIStore();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [quantity, setQuantity] = useState(1); // 新增数量状态
  const [errors, setErrors] = useState({
    address: '',
    contactName: '',
    contactPhone: ''
  });

  // 计算总价（包含数量）
  const calculatedTotalPrice = totalPrice * quantity;

  // 加载用户地址信息
  useEffect(() => {
    if (isLoggedIn) {
      const loadAddress = async () => {
        try {
          const response = await fetch('/api/address/me');
          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              setAddress(data.address.address);
              setContactName(data.address.realName);
              setContactPhone(data.address.phone);
            }
          }
        } catch (error) {
          console.error('Failed to load address:', error);
        }
      };
      
      loadAddress();
    }
  }, [isLoggedIn]);

  const validateFields = () => {
    let isValid = true;
    const newErrors = {
      address: '',
      contactName: '',
      contactPhone: ''
    };

    if (!address.trim()) {
      newErrors.address = '收货地址不能为空';
      isValid = false;
    }

    if (!contactName.trim()) {
      newErrors.contactName = '收货人姓名不能为空';
      isValid = false;
    }

    if (!contactPhone.trim()) {
      newErrors.contactPhone = '联系电话不能为空';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleConfirm = async () => {
    if (!isLoggedIn) {
      // 不再跳转登录页面，而是显示登录对话框
      setShowLogin(true);
      onClose(); // 同时关闭当前模态框
      return;
    }

    if (!validateFields()) {
      return;
    }

    try {
      // 添加一个小延迟，确保会话状态同步
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beads: beads.map(b => ({
            id: b.id, // 这是数据库中珠子的真实ID
            name: b.name,
            image: b.image,
            size: b.size,
            price: b.price,
            x: b.x,
            y: b.y,
            rotation: b.rotation,
          })),
          totalPrice: calculatedTotalPrice, // 使用计算后的总价
          quantity, // 添加数量字段
          circumference,
          shippingAddress: address,
          contactName,
          contactPhone,
        }),
      });

      if (response.ok) {
        alert('订单创建成功！');
        onClose();
      } else {
        const errorData = await response.json();
        alert(`订单创建失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('订单创建失败，请稍后重试');
    }
  };

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      // 不再跳转登录页面，而是显示登录对话框
      setShowLogin(true);
      onClose(); // 同时关闭当前模态框
      return;
    }

    if (!validateFields()) {
      return;
    }

    try {
      // 保存设计，包含快照
      let thumb = '';
      if (typeof window !== 'undefined' && typeof (window as any).getStageSnapshot === 'function') {
        thumb = (window as any).getStageSnapshot() || '';
      }

      // 保存当前设计（包含快照）
      const payload = {
        name: `订单_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`, // 生成订单名称
        beads: beads.map(b => ({
          id: b.id,
          x: b.x,
          y: b.y,
          rotation: b.rotation,
        })),
        circumference,
        thumb, // 包含快照
      };

      const saveResponse = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!saveResponse.ok) {
        console.error('Failed to save design before ordering');
      }

      // 添加一个小延迟，确保会话状态同步
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beads: beads.map(b => ({
            id: b.id, // 这是数据库中珠子的真实ID
            name: b.name,
            image: b.image,
            size: b.size,
            price: b.price,
            x: b.x,
            y: b.y,
            rotation: b.rotation,
          })),
          totalPrice: calculatedTotalPrice, // 使用计算后的总价
          quantity, // 添加数量字段
          circumference,
          shippingAddress: address,
          contactName,
          contactPhone,
        }),
      });

      if (response.ok) {
        alert('订单创建成功！');
        onClose();
      } else {
        const errorData = await response.json();
        alert(`订单创建失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('订单创建失败，请稍后重试');
    }
  };

  // 数量变化处理函数
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1)); // 最少为1
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">定制商品详情</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">设计预览</h3>
            <div className="border rounded-lg p-4 min-h-[120px] bg-gray-50">
              {beads.length > 0 ? (
                <>
                  {/* 显示快照缩略图，如果可用的话 */}
                  <div className="mb-4">
                    {typeof window !== 'undefined' && typeof (window as any).getStageSnapshot === 'function' ? (
                      (() => {
                        const snapshot = (window as any).getStageSnapshot();
                        return snapshot ? (
                          <div className="flex justify-center">
                            <img 
                              src={snapshot} 
                              alt="设计快照" 
                              className="max-h-32 rounded border mx-auto"
                              onError={(e) => {
                                console.log("快照图片加载失败");
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            快照正在生成中...
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        无法获取设计快照
                      </div>
                    )}
                  </div>
                  
                  {/* 传统珠子预览 */}
                  <div className="grid grid-cols-3 gap-2">
                    {beads.slice(0, 6).map((bead, index) => (
                      <div key={index} className="flex flex-col items-center">
                        {bead.image ? (
                          <img 
                            src={bead.image} 
                            alt={bead.name} 
                            className="w-12 h-12 object-cover rounded-full border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">无图</span>
                          </div>
                        )}
                        <span className="text-xs mt-1 truncate w-full">{bead.name}</span>
                      </div>
                    ))}
                    {beads.length > 6 && (
                      <div className="flex items-center justify-center text-gray-500 text-sm">
                        +{beads.length - 6}...
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">暂无珠子</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">基本信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>珠子数量:</span>
                <span>{beads.length} 颗</span>
              </div>
              <div className="flex justify-between">
                <span>手围尺寸:</span>
                <span>{circumference} cm</span>
              </div>
              
              {/* 数量选择器 */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span>购买数量:</span>
                <div className="flex items-center">
                  <button 
                    onClick={decreaseQuantity}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-100 hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="w-12 h-8 flex items-center justify-center border-t border-b border-gray-300">
                    {quantity}
                  </span>
                  <button 
                    onClick={increaseQuantity}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between font-bold text-lg">
                <span>总价:</span>
                <span className="text-red-500">¥{calculatedTotalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">收货信息</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">收货人姓名 *</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value);
                    if (errors.contactName && !e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, contactName: '收货人姓名不能为空' }));
                    } else if (errors.contactName) {
                      setErrors(prev => ({ ...prev, contactName: '' }));
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.contactName ? 'border-red-500' : ''}`}
                  placeholder="请输入收货人姓名"
                />
                {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
              </div>
              
              <div>
                <label className="block text-sm mb-1">联系电话 *</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value);
                    if (errors.contactPhone && !e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, contactPhone: '联系电话不能为空' }));
                    } else if (errors.contactPhone) {
                      setErrors(prev => ({ ...prev, contactPhone: '' }));
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.contactPhone ? 'border-red-500' : ''}`}
                  placeholder="请输入联系电话"
                />
                {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
              </div>
              
              <div>
                <label className="block text-sm mb-1">收货地址 *</label>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address && !e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, address: '收货地址不能为空' }));
                    } else if (errors.address) {
                      setErrors(prev => ({ ...prev, address: '' }));
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.address ? 'border-red-500' : ''}`}
                  rows={2}
                  placeholder="请输入收货地址"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 font-medium"
            >
              取消
            </button>
            <button
              onClick={handlePurchase}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 transition-colors"
            >
              立即购买
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}