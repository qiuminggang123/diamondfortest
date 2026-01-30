import { useState } from "react";
import { signIn } from "next-auth/react";
import { useStore } from "@/lib/store"; // 导入store来触发更新

export default function RegisterModal({ 
  open, 
  onClose, 
  switchToLogin 
}: { 
  open: boolean; 
  onClose: () => void; 
  switchToLogin?: () => void; 
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [realName, setRealName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    realName: '',
    phone: '',
    address: ''
  });

  if (!open) return null;

  const validateFields = () => {
    let isValid = true;
    const newErrors = {
      realName: '',
      phone: '',
      address: ''
    };

    if (!realName.trim()) {
      newErrors.realName = '真实姓名不能为空';
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = '联系电话不能为空';
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '联系电话格式不正确';
      isValid = false;
    }

    if (!address.trim()) {
      newErrors.address = '收货地址不能为空';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, realName, address, phone })
      });

      const data = await res.json();

      if (data.success) {
        // 注册成功，自动登录
        const signInRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.ok) {
          onClose(); // 关闭模态框
        } else {
          setError("自动登录失败，请手动登录");
        }
      } else {
        setError(data.message || "注册失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-center">注册</h2>
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="用户名"
            className="border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="邮箱"
            className="border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密码"
            className="border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="真实姓名"
            className="border rounded px-3 py-2"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            required
          />
          {errors.realName && <div className="text-red-500 text-sm">{errors.realName}</div>}
          
          <input
            type="text"
            placeholder="联系电话"
            className="border rounded px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {errors.phone && <div className="text-red-500 text-sm">{errors.phone}</div>}
          
          <textarea
            placeholder="收货地址"
            className="border rounded px-3 py-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          {errors.address && <div className="text-red-500 text-sm">{errors.address}</div>}
          
          <button type="submit" className="bg-green-600 text-white rounded py-2 font-semibold" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
          
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        </form>
        
        <div className="mt-4 text-center text-sm">
          <span>已有账号？</span>
          <button 
            type="button" 
            className="ml-1 text-blue-500 font-medium underline"
            onClick={() => switchToLogin ? switchToLogin() : onClose()}
          >
            立即登录
          </button>
        </div>
        
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose} title="关闭">×</button>
      </div>
    </div>
  );
}