import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';  // 与其他API保持一致

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('GET Orders - Session validation failed:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email 
      });
      return Response.json(
        { success: false, message: '未授权访问或会话信息不完整' },
        { status: 401 }
      );
    }

    // 检查是否为管理员，支持多种环境变量名称
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = session.user.email === adminEmail;
    
    let orders;
    if (isAdmin) {
      // 管理员获取所有订单，并包含用户信息
      orders = await prisma.order.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true, // 包含用户信息
          design: {
            include: {
              beads: {
                include: {
                  bead: true
                }
              }
            }
          }
        }
      });
    } else {
      // 普通用户只能获取自己的订单
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      
      if (!user || !user.id) {
        return Response.json(
          { success: false, message: '用户不存在或ID缺失' },
          { status: 401 }
        );
      }

      orders = await prisma.order.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          design: {
            include: {
              beads: {
                include: {
                  bead: true
                }
              }
            }
          }
        }
      });
    }

    return Response.json({ success: true, orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return Response.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let session = await getServerSession(authOptions);
    
    // 与其他API保持一致，使用email验证登录状态
    if (!session?.user?.email) {
      console.log('Session validation failed:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        fullSession: session ? JSON.stringify(session, null, 2) : 'null'
      });
      
      // 如果没有用户email，尝试再次获取会话
      await new Promise(resolve => setTimeout(resolve, 300)); // 等待一会再重试
      const retrySession = await getServerSession(authOptions);
      
      console.log('Retry session attempt:', {
        hasRetrySession: !!retrySession,
        hasRetryUser: !!retrySession?.user,
        retryUserEmail: retrySession?.user?.email,
        retryUserId: retrySession?.user?.id
      });
      
      if (!retrySession?.user?.email) {
        console.log('Retry session validation also failed');
        return Response.json(
          { success: false, message: '未授权访问或会话信息不完整' },
          { status: 401 }
        );
      }
      
      session = retrySession;
    }

    // 通过email找到用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user || !user.id) {
      return Response.json(
        { success: false, message: '用户不存在或ID缺失' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { 
      beads, 
      totalPrice, 
      circumference, 
      shippingAddress, 
      contactName, 
      contactPhone 
    } = data;

    console.log('Processing order for user:', user.id);

    if (!shippingAddress || !contactName || !contactPhone) {
      return Response.json(
        { success: false, message: '缺少必要信息' },
        { status: 400 }
      );
    }

    // 验证珠子数据是否存在
    if (!Array.isArray(beads) || beads.length === 0) {
      return Response.json(
        { success: false, message: '设计中没有珠子' },
        { status: 400 }
      );
    }

    // 验证珠子数据结构
    for (const bead of beads) {
      if (!bead.id) {
        return Response.json(
          { success: false, message: '珠子数据不完整' },
          { status: 400 }
        );
      }
    }

    // 创建设计草稿
    const design = await prisma.design.create({
      data: {
        name: `订单_${new Date().toISOString().slice(0, 10)}`,
        userId: user.id,  // 使用从数据库查询到的用户ID
        circumference: circumference,
        thumb: '', // 可以稍后更新为实际的缩略图
      },
    });

    // 为设计添加珠子
    for (let i = 0; i < beads.length; i++) {
      const bead = beads[i];
      await prisma.designBead.create({
        data: {
          designId: design.id,
          beadId: bead.id,
          x: bead.x,
          y: bead.y,
          rotation: bead.rotation,
          order: i,
        },
      });
    }

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId: user.id,  // 使用从数据库查询到的用户ID
        designId: design.id,
        totalPrice: totalPrice,
        shippingAddress,
        contactName,
        contactPhone,
        status: 'PENDING',
      },
    });

    return Response.json({ success: true, order });
  } catch (error) {
    console.error('创建订单失败:', error);
    // 对于开发阶段，返回详细错误信息，生产环境应该只返回通用错误
    return Response.json(
      { success: false, message: process.env.NODE_ENV === 'development' ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}

// PUT路由用于更新订单状态
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查是否为管理员，支持多种环境变量名称
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    if (!session?.user?.email || session.user.email !== adminEmail) {
      console.log('Update order status - Admin validation failed:', { 
        userEmail: session?.user?.email,
        adminEmail,
        isMatch: session?.user?.email === adminEmail
      });
      return Response.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { orderId, status } = data;

    if (!orderId || !status) {
      return Response.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证状态值
    if (!['PENDING', 'SHIPPED'].includes(status)) {
      return Response.json(
        { success: false, message: '无效的订单状态' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: status,
      },
    });

    return Response.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return Response.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}