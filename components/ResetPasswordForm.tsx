import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("链接无效或已过期");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) throw new Error("重置失败");
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError("重置失败，链接可能已失效");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 text-center">重置密码</h2>
        {success ? (
          <div className="text-green-600 text-center mb-4">密码重置成功，正在跳转...</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="新密码（至少6位）"
              className="border rounded px-3 py-2"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="确认新密码"
              className="border rounded px-3 py-2"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <button type="submit" className="bg-blue-600 text-white rounded py-2 font-semibold" disabled={loading}>
              {loading ? "重置中..." : "重置密码"}
            </button>
            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
