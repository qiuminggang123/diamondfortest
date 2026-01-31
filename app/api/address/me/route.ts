import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { addressInfo: true },
  });
  return NextResponse.json({ address: user?.addressInfo });
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { address, realName, phone } = await req.json();
  if (!address || !realName || !phone) return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  // 更新User表冗余字段
  await prisma.user.update({
    where: { email: session.user.email },
    data: { address, realName, phone },
  });
  // 更新/创建Address表
  await prisma.address.upsert({
    where: { userId: user.id },
    update: { address, realName, phone },
    create: { userId: user.id, address, realName, phone },
  });
  return NextResponse.json({ success: true });
}