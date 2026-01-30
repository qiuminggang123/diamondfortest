"use client";

import { useState, useEffect } from "react";
import { useAuthStatus } from "@/lib/useAuthStatus";
import AdminHeader from "@/components/AdminHeader";
import { useStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import {
  Trash2,
  Upload,
  Plus,
  Image as ImageIcon,
  Edit2,
  X,
  Tags,
  Check,
  Package,
  Truck,
  Clock
} from "lucide-react";
import { BeadType, Category } from "@/lib/types";

function AdminPage() {
  const { isLoggedIn, status } = useAuthStatus();
  const setLibrary = useStore((state) => state.setLibrary ? state.setLibrary : (lib: any) => {});
  const {
    library,
    categories,
    addToLibrary,
    removeFromLibrary,
    updateLibraryItem,
    addCategory,
    removeCategory,
    updateCategory,
  } = useStore();


  // 登录校验：未登录跳转首页并弹出登录弹窗
  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) {
      window.location.href = "/?login=1";
    }
  }, [isLoggedIn, status]);

  // 珠子数据远程加载
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/bead')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          if (typeof setLibrary === 'function') setLibrary(data.data);
        }
      });
  }, [setLibrary, isLoggedIn]);

  // SSR/CSR hydration 修复：只在客户端渲染依赖异步数据的内容
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { showToast, showConfirm } = useUIStore();

  // Bead State
  const [editingId, setEditingId] = useState<string | null>(null);
  // 获取第一个有效分类id
  const getDefaultCategoryId = () => {
    const valid = categories.filter(cat => !["all", "in-use"].includes(cat.id));
    return valid.length > 0 ? valid[0].id : "";
  };

  const [newBead, setNewBead] = useState<Omit<BeadType, "id">>({
    name: "",
    type: getDefaultCategoryId(),
    size: 10,
    price: 10,
    image: "",
  });

  // Category State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState("");

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 加载订单数据
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/order');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        showToast(data.message || '获取订单失败', 'error');
      }
    } catch (err) {
      console.error('获取订单失败:', err);
      showToast('获取订单失败', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  // 更新订单状态
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
        showToast(`订单状态已更新为${newStatus === 'PENDING' ? '待发货' : '已发货'}`, 'success');
      } else {
        if (res.status === 401) {
          showToast('权限不足或会话过期，请确认您是管理员身份并刷新页面重试', 'error');
        } else {
          showToast(data.message || '更新订单状态失败', 'error');
        }
      }
    } catch (err) {
      console.error('更新订单状态失败:', err);
      showToast('网络错误，更新订单状态失败', 'error');
    }
  };

  // 初始加载订单
  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
    }
  }, [isLoggedIn]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;

      // Calculate Dominant Color
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 50;
          canvas.height = 50;
          ctx.drawImage(img, 0, 0, 50, 50);
          const imageData = ctx.getImageData(0, 0, 50, 50);
          let r = 0,
            g = 0,
            b = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
          }
          const count = imageData.data.length / 4;
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          const hex =
            "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

          setNewBead((prev) => ({
            ...prev,
            image: result,
            dominantColor: hex,
          }));
        } else {
          setNewBead((prev) => ({ ...prev, image: result }));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // 刷新素材库列表
  const refreshLibrary = async () => {
    const res = await fetch('/api/bead');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      if (typeof setLibrary === 'function') setLibrary(data.data);
    }
  };

  const handleSubmit = async () => {
    if (!newBead.name || !newBead.image) {
      showToast("Name and Image required", "error");
      return;
    }

    if (editingId) {
      // Update existing（PUT）
      try {
        const res = await fetch('/api/bead', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newBead, id: editingId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateLibraryItem({ ...newBead, id: editingId });
          await refreshLibrary();
          showToast("已保存修改", "success");
          resetForm();
        } else {
          showToast(data.message || "保存失败", "error");
        }
      } catch (e) {
        showToast("网络错误，保存失败", "error");
      }
    } else {
      // Add new（POST）
      try {
        const res = await fetch('/api/bead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBead),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          addToLibrary(data.data as BeadType); // 后端返回新建对象
          await refreshLibrary();
          showToast("已添加至素材库", "success");
          resetForm();
        } else {
          showToast(data.message || "添加失败", "error");
        }
      } catch (e) {
        showToast("网络错误，添加失败", "error");
      }
    }
  };

  const handleEdit = (item: BeadType) => {
    setEditingId(item.id);
    setNewBead({
      name: item.name,
      type: item.type,
      size: item.size,
      price: item.price,
      image: item.image,
      dominantColor: item.dominantColor, // Preserve dominant color
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewBead({
      name: "",
      type: getDefaultCategoryId(),
      size: 10,
      price: 10,
      image: "",
      dominantColor: undefined,
    });
  };

  // 刷新分类列表
  const refreshCategories = async () => {
    const res = await fetch('/api/category');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      if (typeof useStore.getState().setCategories === 'function') {
        useStore.getState().setCategories(data.data);
      }
    }
  };

  // Category Handlers
  const handleAddCategory = async () => {
    if (!catNameInput.trim()) return;
    try {
      const res = await fetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catNameInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        addCategory(data.data);
        await refreshCategories();
        showToast('分类已添加', 'success');
        setCatNameInput("");
      } else {
        showToast(data.error || '添加失败', 'error');
      }
    } catch {
      showToast('网络错误，添加失败', 'error');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCatId || !catNameInput.trim()) return;
    try {
      const res = await fetch('/api/category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCatId, name: catNameInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        updateCategory(data.data);
        await refreshCategories();
        showToast('分类已修改', 'success');
        setEditingCatId(null);
        setCatNameInput("");
      } else {
        showToast(data.error || '修改失败', 'error');
      }
    } catch {
      showToast('网络错误，修改失败', 'error');
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatNameInput(cat.name);
  };

  const handleDeleteCategory = (id: string) => {
    if (["all", "in-use"].includes(id)) {
      showToast("系统分类无法删除", "error");
      return;
    }
    showConfirm({
      title: "删除分类",
      message: "确定删除此分类吗？关联的珠子可能无法正确显示。",
      onConfirm: async () => {
        try {
          const res = await fetch('/api/category', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            removeCategory(id);
            await refreshCategories();
            showToast('分类已删除', 'success');
          } else {
            showToast(data.error || '删除失败', 'error');
          }
        } catch {
          showToast('网络错误，删除失败', 'error');
        }
      }
    });
  };

  if (!isLoggedIn) return null;

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 relative">
      <AdminHeader />
      <div className="p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          素材库管理后台
        </h1>

        {/* Order Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" /> 订单管理
          </h2>

          {loadingOrders ? (
            <div className="text-center py-4">加载订单中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总价</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下单时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.user?.name || order.user?.email || '未知用户'}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => updateOrderStatus(order.id, order.status === 'PENDING' ? 'SHIPPED' : 'PENDING')}
                          className={`mr-4 ${
                            order.status === 'PENDING' 
                              ? 'text-yellow-600 hover:text-yellow-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {order.status === 'PENDING' ? '标记为已发货' : '标记为待发货'}
                        </button>
                        <button
                          onClick={() => {
                            // 查看订单详情的处理
                            alert(`订单详情：\n${JSON.stringify(order, null, 2)}`);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {orders.length === 0 && (
                <div className="text-center py-4 text-gray-500">暂无订单</div>
              )}
            </div>
          )}
        </div>

        {/* Category Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tags className="w-5 h-5 text-purple-600" /> 分类管理
          </h2>

          <div className="w-full mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
              <input
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="分类名称 (例如: 极品天珠)"
                value={catNameInput}
                onChange={(e) => setCatNameInput(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                {editingCatId ? (
                  <>
                    <button
                      onClick={handleUpdateCategory}
                      className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingCatId(null);
                        setCatNameInput("");
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 whitespace-nowrap"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddCategory}
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={18} />
                    <span>新增分类</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories
              .filter(cat => !["all", "in-use"].includes(cat.id))
              .map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditCategory(cat)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Bead Management */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" /> 珠子管理
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-6">
                {editingId ? "编辑珠子" : "添加新珠子"}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    珠子名称
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={newBead.name}
                    onChange={(e) =>
                      setNewBead({ ...newBead, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg"
                    value={newBead.type}
                    onChange={(e) =>
                      setNewBead({ ...newBead, type: e.target.value })
                    }
                  >
                    {categories
                      .filter(cat => !["all", "in-use"].includes(cat.id))
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      尺寸 (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg"
                      value={newBead.size}
                      onChange={(e) =>
                        setNewBead({ ...newBead, size: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      价格 (元)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg"
                      value={newBead.price}
                      onChange={(e) =>
                        setNewBead({ ...newBead, price: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleSubmit}
                    className={`flex-1 py-3 text-white rounded-lg font-medium transition shadow-md ${editingId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {editingId ? "保存修改" : "确认添加至库"}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                    >
                      取消
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-6">上传图片</h3>
              
              <div className="space-y-6">
                {/* Image Preview */}
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 relative">
                  {newBead.image ? (
                    <div className="relative w-48 h-48 mb-4 group">
                      <img
                        src={newBead.image}
                        alt="Preview"
                        className="w-full h-full object-contain drop-shadow-lg"
                      />
                      <button
                        onClick={() => setNewBead({ ...newBead, image: "" })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 mb-4">
                      <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-2 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 opacity-30" />
                      </div>
                      <p>支持 JPG, PNG, WEBP (建议透明背景)</p>
                    </div>
                  )}

                  <label className="cursor-pointer bg-white border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
                    <Upload size={18} />
                    <span>{newBead.image ? "更换贴图" : "上传贴图"}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-400">
                    注意：贴图中必须包含横向水平的绳子穿过珠子中心
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* List Section 仅客户端渲染，避免 hydration 错误 */}
          {mounted ? (
            <>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 mt-10">
                当前素材库列表 ({library.length})
                <span className="text-sm font-normal text-gray-400 ml-2">
                  点击卡片可进行编辑
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {library.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    className={`cursor-pointer bg-white rounded-xl shadow-sm overflow-hidden group border transition-all hover:shadow-md ${editingId === item.id ? "ring-2 ring-green-500 border-green-500 transform scale-[1.02]" : "border-gray-100 hover:border-blue-200"}`}
                  >
                    <div className="relative aspect-square p-4 bg-gray-50 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering edit
                          showConfirm({
                            title: "删除素材",
                            message: "确定要删除这个素材吗？",
                            onConfirm: () => {
                              // 删除素材（DELETE）
                              fetch('/api/bead', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: item.id }),
                              })
                                .then(res => res.json())
                                .then(async data => {
                                  if (data.success) {
                                    removeFromLibrary(item.id);
                                    await refreshLibrary();
                                    showToast("素材已删除", "success");
                                  } else {
                                    showToast(data.message || "删除失败", "error");
                                  }
                                })
                                .catch(() => {
                                  showToast("网络错误，删除失败", "error");
                                });
                            },
                          });
                        }}
                        className="absolute top-2 right-2 bg-white text-red-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-800 truncate">
                        {item.name}
                      </h3>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{item.size}mm</span>
                        <span className="text-blue-600 font-bold">¥{item.price}</span>
                      </div>
                    </div>
                    {editingId === item.id && (
                      <div className="bg-green-100 text-green-700 text-xs text-center py-1 font-medium">
                        正在编辑...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 mt-10">
              当前素材库列表 (...)
            </h2>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminPage;