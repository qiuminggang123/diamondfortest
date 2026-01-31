import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/order - 获取订单
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    // 检查是否是管理员
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = session.user.email === adminEmail;

    let orders;
    if (isAdmin) {
      // 管理员查看所有订单
      orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          design: {
            include: {
              beads: {
                include: {
                  bead: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // 普通用户只能查看自己的订单
      // 首先根据邮箱获取用户ID
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (!user) {
        return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
      }
      
      orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          design: {
            include: {
              beads: {
                include: {
                  bead: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      id: order.id,
      userId: order.userId,
      user: order.user,
      designId: order.designId,
      design: order.design,
      totalPrice: order.totalPrice,
      status: order.status,
      shippingAddress: order.shippingAddress,
      contactName: order.contactName,
      contactPhone: order.contactPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return Response.json({ success: true, orders: formattedOrders });
  } catch (e) {
    console.error('获取订单失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/order - 创建订单
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const { designId, shippingAddress, contactName, contactPhone, totalPrice, quantity } = await req.json();

    if (!designId || !shippingAddress || !contactName || !contactPhone) {
      return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // 首先根据邮箱获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 获取设计和其中的珠子
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        beads: {
          include: {
            bead: true
          }
        }
      }
    });

    if (!design || design.userId !== user.id) {
      return Response.json({ success: false, error: '设计不存在或不属于当前用户' }, { status: 400 });
    }

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        designId,
        totalPrice: totalPrice || 0,
        shippingAddress,
        contactName,
        contactPhone,
        quantity: quantity || 1,
      }
    });

    return Response.json({ success: true, data: order });
  } catch (e) {
    console.error('创建订单失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// PUT /api/order - 更新订单状态
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // 检查是否是管理员
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = session.user.email === adminEmail;

    if (!isAdmin) {
      return Response.json({ success: false, error: '权限不足' }, { status: 401 });
    }

    // 更新订单状态
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    return Response.json({ success: true, data: updatedOrder });
  } catch (e) {
    console.error('更新订单失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// DELETE /api/order - 删除订单
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return Response.json({ success: false, error: '缺少订单ID' }, { status: 400 });
    }

    // 检查是否是管理员
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = session.user.email === adminEmail;

    if (!isAdmin) {
      return Response.json({ success: false, error: '权限不足' }, { status: 401 });
    }

    // 删除订单
    await prisma.order.delete({
      where: { id }
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error('删除订单失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
