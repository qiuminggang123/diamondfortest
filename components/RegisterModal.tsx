import { useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [realName, setRealName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, realName, address, phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "注册失败");
      return;
    }
    // 注册成功后自动登录
    await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-center">注册</h2>
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="昵称"
            className="border rounded px-3 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="收件人姓名"
            className="border rounded px-3 py-2"
            value={realName}
            onChange={e => setRealName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="联系电话"
            className="border rounded px-3 py-2"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="收货地址"
            className="border rounded px-3 py-2"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="邮箱"
            className="border rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密码"
            className="border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-green-600 text-white rounded py-2 font-semibold" disabled={loading}>邮箱注册</button>
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        </form>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose} title="关闭">×</button>
      </div>
    </div>
  );
}
