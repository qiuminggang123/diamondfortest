import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return new Response(JSON.stringify({ error: "参数缺失" }), { status: 400 });
  }
  const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpires: { gt: new Date() } } });
  if (!user) {
    return new Response(JSON.stringify({ error: "重置链接无效或已过期" }), { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpires: null },
  });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}