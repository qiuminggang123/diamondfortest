import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  let beads = null;
  let error = null;
  try {
    beads = await prisma.bead.findMany({ take: 5 });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL,
    beads,
    error,
  });
}
