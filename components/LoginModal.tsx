import { signIn } from "next-auth/react";
import { useState } from "react";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      setError("邮箱或密码错误");
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-6 text-center">登录</h2>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
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
            <div className="flex justify-between items-center">
              <button type="submit" className="bg-blue-600 text-white rounded py-2 font-semibold w-1/2" disabled={loading}>邮箱登录</button>
              <button type="button" className="text-blue-500 text-sm underline ml-2 w-1/2 text-right" onClick={() => setShowForgot(true)} tabIndex={-1}>忘记密码？</button>
            </div>
            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          </form>
          <div className="my-4 text-center text-gray-400">或</div>
          <button
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded font-semibold"
            onClick={() => signIn("google")}
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.62 2.7 30.7 0 24 0 14.64 0 6.4 5.48 2.44 13.44l8.44 6.56C12.98 13.36 17.08 9.5 24 9.5z"/><path fill="#34A853" d="M46.09 24.5c0-1.54-.14-3.02-.39-4.45H24v8.45h12.45c-.54 2.92-2.18 5.4-4.65 7.07l7.19 5.59C43.98 37.36 46.09 31.36 46.09 24.5z"/><path fill="#FBBC05" d="M10.88 28.5c-.64-1.92-1-3.96-1-6s.36-4.08 1-6l-8.44-6.56C.8 13.98 0 18.04 0 24c0 5.96.8 10.02 2.44 13.06l8.44-6.56z"/><path fill="#EA4335" d="M24 48c6.7 0 12.62-2.22 16.64-6.06l-7.19-5.59c-2.01 1.36-4.6 2.15-7.45 2.15-6.92 0-11.02-3.86-13.12-7.5l-8.44 6.56C6.4 42.52 14.64 48 24 48z"/></g></svg>
            Google 登录
          </button>
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose} title="关闭">×</button>
        </div>
      </div>
      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />
    </>
  );
}
