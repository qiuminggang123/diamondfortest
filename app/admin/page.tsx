"use client";

import { useState, useEffect } from "react";
import { useAuthStatus } from "@/lib/useAuthStatus";
import Header from "@/components/Header";
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
  Clock,
  ShoppingCart,
  Home,
  ChevronRight,
  Move
} from "lucide-react";
import Link from "next/link";
import { BeadType, Category } from "@/lib/types";
import { uploadImageToBlob } from '@/lib/blob';

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

  // Login verification: Redirect to homepage and pop up login modal if not logged in
  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) {
      window.location.href = "/?login=1";
    }
  }, [isLoggedIn, status]);

  // Remote loading of bead data
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

  // Remote loading of category data
  useEffect(() => {
    if (!isLoggedIn) return;
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/category');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const storeState = useStore.getState();
          if (typeof storeState.setCategories === 'function') {
            storeState.setCategories(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to load category data:', error);
      }
    };
    loadCategories();
  }, [isLoggedIn]);

  // SSR/CSR hydration 修复：只在客户端渲染依赖异步数据的内容
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { showToast, showConfirm, showLoading, hideLoading } = useUIStore();

  // Adding current active tab state
  const [activeTab, setActiveTab] = useState<'beads' | 'materials' | 'orders'>('beads');

  // Bead State
  const [editingId, setEditingId] = useState<string | null>(null);
  // Get the first valid category id
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

  // Load order data
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/order');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        showToast(data.message || 'Failed to get orders', 'error');
      }
    } catch (err) {
      console.error('Failed to get orders:', err);
      showToast('Failed to get orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Update order status
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
        showToast(`Order status updated to ${newStatus === 'PENDING' ? 'Pending Shipment' : 'Shipped'}`, 'success');
      } else {
        if (res.status === 401) {
          showToast('Insufficient permissions or session expired. Please confirm you are an administrator and refresh the page to try again', 'error');
        } else {
          showToast(data.message || 'Failed to update order status', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      showToast('Network error, failed to update order status', 'error');
    }
  };

  // Initial order loading
  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
    }
  }, [isLoggedIn]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      showLoading({ message: 'Uploading image...' });
      
      // Upload to vercel blob
      const imageUrl = await uploadImageToBlob(file);
      
      // Calculate Dominant Color
      const img = new Image();
      // Set crossOrigin attribute to handle cross-origin images
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
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
              image: imageUrl,
              dominantColor: hex,
            }));
          } else {
            setNewBead((prev) => ({ ...prev, image: imageUrl }));
          }
        } catch (canvasError) {
          console.warn('Unable to extract dominant color, using default color:', canvasError);
          setNewBead((prev) => ({ ...prev, image: imageUrl }));
        } finally {
          hideLoading();
        }
      };
      
      // Add error handling
      img.onerror = (error) => {
        console.warn('Image loading failed, skipping dominant color extraction:', error);
        setNewBead((prev) => ({ ...prev, image: imageUrl }));
        hideLoading();
      };
      
      img.src = imageUrl;
    } catch (uploadError) {
      console.error('Image upload failed:', uploadError);
      showToast('Image upload failed, please try again', 'error');
      hideLoading();
    }
  };

  // Refresh material library list
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

    try {
      showLoading({ 
        message: editingId ? 'Updating bead...' : 'Adding bead...'
      });

      if (editingId) {
        // Update existing（PUT）
        const res = await fetch('/api/bead', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newBead, id: editingId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateLibraryItem({ ...newBead, id: editingId });
          await refreshLibrary();
          showToast("Changes saved", "success");
          resetForm();
        } else {
          showToast(data.message || "Save failed", "error");
        }
      } else {
        // Add new（POST）
        const res = await fetch('/api/bead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBead),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          addToLibrary(data.data as BeadType); // Backend returns newly created object
          await refreshLibrary();
          showToast("Added to material library", "success");
          resetForm();
        } else {
          showToast(data.message || "Add failed", "error");
        }
      }
    } catch (e) {
      showToast(editingId ? "Network error, save failed" : "Network error, add failed", "error");
    } finally {
      hideLoading();
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

  // Refresh category list
  const refreshCategories = async () => {
    const res = await fetch('/api/category');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      const storeState = useStore.getState();
      if (storeState.setCategories) {
        storeState.setCategories(data.data);
      }
    }
  };

  // Category Handlers
  const handleAddCategory = async () => {
    if (!catNameInput.trim()) return;
    try {
      showLoading({ message: 'Adding category...' });
      const res = await fetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catNameInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        addCategory(data.data);
        await refreshCategories();
        showToast('Category added', 'success');
        setCatNameInput("");
      } else {
        showToast(data.error || 'Add failed', 'error');
      }
    } catch {
      showToast('Network error, add failed', 'error');
    } finally {
      hideLoading();
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCatId || !catNameInput.trim()) return;
    try {
      showLoading({ message: 'Updating category...' });
      const res = await fetch('/api/category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCatId, name: catNameInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        updateCategory(data.data);
        await refreshCategories();
        showToast('Category updated', 'success');
        setEditingCatId(null);
        setCatNameInput("");
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error, update failed', 'error');
    } finally {
      hideLoading();
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatNameInput(cat.name);
  };

  const handleDeleteCategory = (id: string) => {
    if (["all", "in-use"].includes(id)) {
      showToast("System categories cannot be deleted", "error");
      return;
    }
    showConfirm({
      title: "Delete category",
      message: "Are you sure you want to delete this category? Associated beads may not display correctly.",
      onConfirm: async () => {
        try {
          showLoading({ message: 'Deleting category...' });
          const res = await fetch('/api/category', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            removeCategory(id);
            await refreshCategories();
            showToast('Category deleted', 'success');
          } else {
            showToast(data.error || 'Deletion failed', 'error');
          }
        } catch {
          showToast('Network error, deletion failed', 'error');
        } finally {
          hideLoading();
        }
      }
    });
  };

  if (!isLoggedIn) return null;

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 pt-14"> {/* Adding pt-14 to leave space for Header */}
      <Header />
      <div className="p-8 max-w-6xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-medium">Admin Dashboard</span>
        </nav>
        
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Admin Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'beads'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('beads')}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Bead Management
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'materials'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('materials')}
          >
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Category Management
            </div>
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Order Management
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">

          {/* Bead Management Tab */}
          {activeTab === 'beads' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" /> Bead Management
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-6">
                    {editingId ? "Edit Bead" : "Add New Bead"}
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bead Name
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
                        Category
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
                          Size (mm)
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
                          Price (GBP)

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
                        {editingId ? "Save Changes" : "Add to Library"}

                      </button>
                      {editingId && (
                        <button
                          onClick={resetForm}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                          Cancel

                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-6">Upload Image</h3>
                  
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
                          <p>Support JPG, PNG, WEBP (transparent background recommended)</p>
                        </div>
                      )}

                      <label className="cursor-pointer bg-white border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
                        <Upload size={18} />
                        <span>{newBead.image ? "Change Texture" : "Upload Texture"}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-400">
                        Note: The texture must contain a horizontal rope passing through the center of the bead
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* List Section 仅客户端渲染，避免 hydration 错误 */}
              {mounted ? (
                <>
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 mt-10">
                    Current Material Library ({library.length})
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      Click cards to edit
                    </span>
                  </h2>
                  
                  {/* 排序控制区域 - 动态检测排序功能可用性 */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Move className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">拖拽排序</span>
                        <span className="text-sm text-blue-600">拖动下方珠子卡片调整显示顺序</span>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            showLoading({ message: '正在保存排序...' });
                            // 获取当前显示顺序的珠子ID
                            const beadIds = library.map(item => item.id);
                            const response = await fetch('/api/beads', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ beadIds }),
                            });
                            
                            if (response.ok) {
                              showToast('排序保存成功', 'success');
                              await refreshLibrary(); // 刷新数据
                            } else {
                              const errorData = await response.json();
                              if (errorData.error?.includes('sortOrder field missing')) {
                                showToast('排序功能暂不可用，请联系管理员', 'error');
                              } else {
                                showToast(errorData.error || '排序保存失败', 'error');
                              }
                            }
                          } catch (error) {
                            showToast('网络错误，排序保存失败', 'error');
                          } finally {
                            hideLoading();
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        保存排序
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {library.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => handleEdit(item)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id);
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const draggedId = e.dataTransfer.getData('text/plain');
                          if (draggedId && draggedId !== item.id) {
                            // 实现拖拽排序逻辑
                            const draggedIndex = library.findIndex(libItem => libItem.id === draggedId);
                            if (draggedIndex !== -1) {
                              const newLibrary = [...library];
                              const [draggedItem] = newLibrary.splice(draggedIndex, 1);
                              newLibrary.splice(index, 0, draggedItem);
                              
                              // 更新本地状态
                              const storeState = useStore.getState();
                              if (typeof storeState.setLibrary === 'function') {
                                storeState.setLibrary(newLibrary);
                              }
                            }
                          }
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        className={`cursor-pointer bg-white rounded-xl shadow-sm overflow-hidden group border transition-all hover:shadow-md ${
                          editingId === item.id 
                            ? "ring-2 ring-green-500 border-green-500 transform scale-[1.02]" 
                            : "border-gray-100 hover:border-blue-200"
                        }`}
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
                                title: "Delete Material",
                                message: "Are you sure you want to delete this material?",
                                onConfirm: async () => {
                                  try {
                                    showLoading({ message: 'Deleting bead...' }); // Show loading modal
                                    // Delete material（DELETE）
                                    const res = await fetch('/api/bead', {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: item.id }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      removeFromLibrary(item.id);
                                      await refreshLibrary();
                                      showToast("Material deleted", "success");
                                    } else {
                                      showToast(data.message || "Delete failed", "error");
                                    }
                                  } catch (error) {
                                    showToast("Network error, delete failed", "error");
                                  } finally {
                                    hideLoading(); // Hide loading modal
                                  }
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
                            <span className="text-blue-600 font-bold">£{item.price}</span>
                          </div>
                        </div>
                        {editingId === item.id && (
                          <div className="bg-green-100 text-green-700 text-xs text-center py-1 font-medium">
                            Editing...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 mt-10">
                  Current Material Library (...)
                </h2>
              )}
            </div>
          )}

          {/* Category Management Tab */}
          {activeTab === 'materials' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Tags className="w-5 h-5 text-purple-600" /> Category Management
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add/Edit Category Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-6">
                    {editingCatId ? "Edit Category" : "Add New Category"}
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg"
                        value={catNameInput}
                        onChange={(e) => setCatNameInput(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={editingCatId ? handleUpdateCategory : handleAddCategory}
                        className={`flex-1 py-3 text-white rounded-lg font-medium transition shadow-md ${editingCatId ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
                      >
                        {editingCatId ? "Save Changes" : "Add Category"}

                      </button>
                      {editingCatId && (
                        <button
                          onClick={() => {
                            setEditingCatId(null);
                            setCatNameInput("");
                          }}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                          Cancel

                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories List */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold mb-6">Current Categories List</h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {categories
                      .filter(cat => !["all", "in-use"].includes(cat.id))
                      .map((cat) => (
                        <div 
                          key={cat.id} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div>
                            <h4 className="font-medium text-gray-800">{cat.name}</h4>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    
                    {categories.filter(cat => !["all", "in-use"].includes(cat.id)).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No categories yet, please add new category
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Management Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" /> Order Management
              </h2>

              {loadingOrders ? (
                <div className="text-center py-4">Loading orders...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.user?.name || order.user?.email || 'Unknown user'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{order.totalPrice.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {order.status === 'PENDING' ? 'Pending Shipment' : 'Shipped'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString('en-US')}
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
                              {order.status === 'PENDING' ? 'Mark as Shipped' : 'Mark as Pending Shipment'}
                            </button>
                            <button
                              onClick={() => {
                                // 查看订单详情的处理
                                alert(`订单详情：\n${JSON.stringify(order, null, 2)}`);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {orders.length === 0 && (
                    <div className="text-center py-4 text-gray-500">No orders yet</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminPage;