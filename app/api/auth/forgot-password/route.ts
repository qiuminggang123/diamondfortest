import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "邮箱不能为空" }), { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return new Response(JSON.stringify({ error: "用户不存在" }), { status: 404 });
  }
  // 生成重置token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30分钟有效
  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExpires: expires },
  });
  // 发送邮件
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  await sendMail({
    to: email,
    subject: "密码重置链接",
    html: `<p>请点击下方链接重置您的密码（30分钟内有效）：</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
