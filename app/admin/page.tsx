"use client";

import { useState } from "react";
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
} from "lucide-react";
import { BeadType, Category } from "@/lib/types";

export default function AdminPage() {
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

  const { showToast, showConfirm } = useUIStore();

  // Bead State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBead, setNewBead] = useState<Omit<BeadType, "id">>({
    name: "",
    type: "crystal",
    size: 10,
    price: 10,
    image: "",
  });

  // Category State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState("");

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

  const handleSubmit = () => {
    if (!newBead.name || !newBead.image) {
      showToast("Name and Image required", "error");
      return;
    }

    if (editingId) {
      // Update existing
      updateLibraryItem({ ...newBead, id: editingId });
      showToast("已保存修改", "success");
      resetForm();
    } else {
      // Add new
      const id = "custom-" + Date.now();
      addToLibrary({ ...newBead, id } as BeadType); // Cast to BeadType
      showToast("已添加至素材库", "success");
      resetForm();
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
      type: categories.length > 2 ? categories[2].id : "other", // Default to first proper category if avail
      size: 10,
      price: 10,
      image: "",
      dominantColor: undefined,
    });
  };

  // Category Handlers
  const handleAddCategory = () => {
    if (!catNameInput.trim()) return;

    const id = "cat-" + Date.now();
    addCategory({ id, name: catNameInput });
    setCatNameInput("");
  };

  const handleUpdateCategory = () => {
    if (!editingCatId || !catNameInput.trim()) return;
    updateCategory({ id: editingCatId, name: catNameInput });
    setEditingCatId(null);
    setCatNameInput("");
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
      onConfirm: () => {
        removeCategory(id);
        showToast("分类已删除", "success");
      },
    });
  };

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 relative">
      <AdminHeader />
      <div className="p-8 max-w-6xl mx-auto w-full">
        {/* ...existing code... */}
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          素材库管理后台
        </h1>

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
                    <Plus size={18} /> 添加分类
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map(
              (cat) =>
                !["all", "in-use"].includes(cat.id) && (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${editingCatId === cat.id ? "bg-purple-50 border-purple-300 ring-1 ring-purple-300" : "bg-gray-50 border-gray-200"}`}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1 ml-2 border-l pl-2 border-gray-300">
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Upload/Edit Section */}
        <div
          className={`p-6 rounded-2xl shadow-sm mb-8 border-2 transition-colors ${editingId ? "bg-blue-50 border-blue-200" : "bg-white border-white"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {editingId ? (
                <Edit2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {editingId ? "编辑素材" : "添加新素材"}
            </h2>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 bg-white px-3 py-1 rounded-full border shadow-sm"
              >
                <X size={14} /> 取消编辑
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  珠子名称
                </label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newBead.name}
                  onChange={(e) =>
                    setNewBead({ ...newBead, name: e.target.value })
                  }
                  placeholder="例如：极品紫水晶"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    类型 (Category)
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg"
                    value={newBead.type}
                    onChange={(e) =>
                      setNewBead({ ...newBead, type: e.target.value })
                    }
                  >
                    {categories.map(
                      (cat) =>
                        !["all", "in-use"].includes(cat.id) && (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ),
                    )}
                  </select>
                </div>
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

        {/* List Section */}
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
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
                        removeFromLibrary(item.id);
                        showToast("素材已删除", "success");
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
      </div>
    </main>
  );
}
