import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const deletedOrders = await prisma.order.deleteMany({});
    const updatedGifts = await prisma.gift.updateMany({
      data: { chosenQuantity: 0 }
    });
    return NextResponse.json({
      message: 'Limpeza concluída com sucesso',
      ordersDeleted: deletedOrders.count,
      giftsReset: updatedGifts.count
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
