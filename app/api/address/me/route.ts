import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 使用 lib 中的 prisma 实例
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // 在构建时，NextAuth 可能无法获取 session，直接返回空值
    // 注意：API Route 不应在构建时被调用，此处仅为防御
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { addressInfo: true },
    });

    return NextResponse.json({ address: user?.addressInfo || null });
  } catch (error) {
    console.error('获取地址信息失败:', error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 同样，构建期间不应调用此接口
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { address, realName, phone } = body;

    if (!address || !realName || !phone) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

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
  } catch (error) {
    console.error('保存地址信息失败:', error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}