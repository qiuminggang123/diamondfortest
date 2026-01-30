import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // 从统一配置文件导入

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
