import { Suspense } from 'react';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">重置密码</h1>
        <Suspense fallback={<div>加载中...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}