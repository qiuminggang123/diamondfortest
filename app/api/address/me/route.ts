import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 检查是否处于构建环境中
const isBuilding = typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;

export async function GET() {
  // 在构建期间跳过数据库操作
  if (isBuilding) {
    return NextResponse.json({ address: null });
  }

  try {
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
  // 在构建期间跳过数据库操作
  if (isBuilding) {
    return NextResponse.json({ error: "构建环境不支持此操作" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    
    const { address, realName, phone } = await req.json();
    if (!address || !realName || !phone) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
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