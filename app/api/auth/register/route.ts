import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password, name, realName, address, phone } = await req.json();
  if (!email || !password || !name || !realName || !address || !phone) {
    return new Response(JSON.stringify({ error: "参数缺失" }), { status: 400 });
  }
  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist) {
    return new Response(JSON.stringify({ error: "邮箱已注册" }), { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      realName,
      address,
      phone,
      addressInfo: {
        create: {
          realName,
          address,
          phone,
        },
      },
    },
    include: { addressInfo: true },
  });
  return new Response(JSON.stringify({ success: true, user }), { status: 201 });
}
