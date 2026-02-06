import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email cannot be empty" }), { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return new Response(JSON.stringify({ error: "User does not exist" }), { status: 404 });
  }
  // Generate reset token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // Valid for 30 minutes
  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExpires: expires },
  });
  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  await sendMail({
    to: email,
    subject: "Password Reset Link",
    html: `<p>Please click the link below to reset your password (valid for 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
