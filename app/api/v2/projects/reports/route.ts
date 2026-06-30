import { NextResponse } from 'next/server';
import { createReport } from '@/lib/apis/project/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = await createReport(body);
    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
