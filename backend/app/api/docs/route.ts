import { getApiDocs } from '@/lib/swagger';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const docs = await getApiDocs();
    const safeDocs = JSON.parse(JSON.stringify(docs));
    return NextResponse.json(safeDocs);
  } catch (error) {
    console.error('Swagger Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate API docs', details: error }, { status: 500 });
  }
}
