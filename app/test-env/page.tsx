"use client";

import { useEffect, useState } from 'react';

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    setEnvVars({
      ENABLE_AUTO_LOGIN: process.env.NEXT_PUBLIC_ENABLE_AUTO_LOGIN,
      DEFAULT_LOGIN_EMAIL: process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL,
      DEFAULT_LOGIN_PASSWORD: process.env.NEXT_PUBLIC_DEFAULT_LOGIN_PASSWORD,
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">环境变量测试页面</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">客户端环境变量:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
    </div>
  );
}