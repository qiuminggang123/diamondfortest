import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { addressInfo: true },
    });
    
    return NextResponse.json({ address: user?.addressInfo || null });
  } catch (error) {
    console.error('Failed to fetch address information:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // 动态导入 Prisma 实例，只在运行时使用
  const { prisma } = await import("@/lib/prisma");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    
    const { address, realName, phone } = await req.json();
    if (!address || !realName || !phone) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }
    
    // Update redundant fields in User table
    await prisma.user.update({
      where: { email: session.user.email },
      data: { address, realName, phone },
    });
    
    // Update/Create Address table
    await prisma.address.upsert({
      where: { userId: user.id },
      update: { address, realName, phone },
      create: { userId: user.id, address, realName, phone },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save address information:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} // 添加缺失的闭合大括号