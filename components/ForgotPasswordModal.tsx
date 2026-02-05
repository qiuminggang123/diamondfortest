"use client";
import { useState } from "react";

export default function ForgotPasswordModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent?: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSent(true);
      onSent?.();
    } catch (err) {
      setError("Sending failed, please check email or try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-201 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6 text-center">找回密码</h2>
        {sent ? (
          <div className="text-green-600 text-center mb-4">重置链接已发送到邮箱，请查收！</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="请输入注册邮箱"
              className="border rounded px-3 py-2"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="bg-blue-600 text-white rounded py-2 font-semibold" disabled={loading}>
              {loading ? "发送中..." : "发送重置链接"}
            </button>
            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          </form>
        )}
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose} title="关闭">×</button>
      </div>
    </div>
  );
}