import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// GET /api/beads - 获取所有珠子，按sortOrder排序（如果字段存在）
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查sortOrder字段是否存在
    let beads;
    try {
      beads = await prisma.bead.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ],
        include: {
          category: true
        }
      });
    } catch (sortError) {
      // 如果sortOrder字段不存在，降级到按创建时间排序
      console.warn('sortOrder字段不存在，使用createdAt排序');
      beads = await prisma.bead.findMany({
        orderBy: [
          { createdAt: 'asc' }
        ],
        include: {
          category: true
        }
      });
    }

    return NextResponse.json(beads);
  } catch (error) {
    console.error('Failed to fetch beads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beads' },
      { status: 500 }
    );
  }
}

// POST /api/beads - 创建新珠子
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, categoryId, size, price, dominantColor } = body;

    // 验证必填字段
    if (!name || !categoryId || !size || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 准备创建数据
    const createData: any = {
      name,
      image,
      categoryId,
      size: parseInt(size),
      price: parseFloat(price),
      dominantColor,
    };

    // 尝试添加sortOrder字段
    try {
      const maxSortOrderResult = await prisma.bead.aggregate({
        _max: {
          sortOrder: true
        }
      });
      createData.sortOrder = (maxSortOrderResult._max.sortOrder || 0) + 1;
    } catch (sortError) {
      // sortOrder字段不存在，跳过
      console.warn('sortOrder字段不存在，跳过排序字段设置');
    }

    const bead = await prisma.bead.create({
      data: createData,
      include: {
        category: true
      }
    });

    revalidatePath('/admin');
    revalidatePath('/');
    
    return NextResponse.json(bead);
  } catch (error) {
    console.error('Failed to create bead:', error);
    return NextResponse.json(
      { error: 'Failed to create bead' },
      { status: 500 }
    );
  }
}

// PUT /api/beads - 更新珠子（单个更新或批量排序）
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查是否是批量排序更新（通过请求体中的beadIds判断）
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    // 如果URL包含ID，则是单个更新；否则是批量排序
    if (id && id !== 'beads') {
      // 单个珠子更新
      const body = await request.json();
      const { name, image, categoryId, size, price, dominantColor } = body;

      // 验证必填字段
      if (!name || !categoryId || !size || price === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const bead = await prisma.bead.update({
        where: { id },
        data: {
          name,
          image,
          categoryId,
          size: parseInt(size),
          price: parseFloat(price),
          dominantColor
        },
        include: {
          category: true
        }
      });

      revalidatePath('/admin');
      revalidatePath('/');
      
      return NextResponse.json(bead);
    } else {
      // 批量排序更新
      const body = await request.json();
      const { beadIds } = body; // 珠子ID数组，按新顺序排列

      if (!Array.isArray(beadIds)) {
        return NextResponse.json(
          { error: 'Invalid bead IDs array' },
          { status: 400 }
        );
      }

      // 尝试批量更新排序
      try {
        const updatePromises = beadIds.map((beadId: string, index: number) =>
          prisma.bead.update({
            where: { id: beadId },
            data: { sortOrder: index }
          })
        );

        await Promise.all(updatePromises);

        revalidatePath('/admin');
        revalidatePath('/');
        
        return NextResponse.json({ message: 'Sort order updated successfully' });
      } catch (sortError) {
        // sortOrder字段不存在，返回错误
        return NextResponse.json(
          { error: 'Sorting not supported - sortOrder field missing' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Failed to update bead:', error);
    return NextResponse.json(
      { error: 'Failed to update bead' },
      { status: 500 }
    );
  }
}

// DELETE /api/beads/{id} - 删除珠子
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Missing bead ID' }, { status: 400 });
    }

    await prisma.bead.delete({
      where: { id }
    });

    revalidatePath('/admin');
    revalidatePath('/');
    
    return NextResponse.json({ message: 'Bead deleted successfully' });
  } catch (error) {
    console.error('Failed to delete bead:', error);
    return NextResponse.json(
      { error: 'Failed to delete bead' },
      { status: 500 }
    );
  }
}