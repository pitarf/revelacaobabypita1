import { NextResponse } from 'next/server';
import { broadcastConfirmedGuests } from '@/services/email';
import { getAdminSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const results = await broadcastConfirmedGuests();

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Erro ao fazer broadcast de emails:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
