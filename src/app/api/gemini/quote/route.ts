import { NextRequest, NextResponse } from 'next/server';
import { generateQuoteWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problem, tradeType, catalog, uploadedDocsText } = body;

    if (!problem) {
      return NextResponse.json({ error: 'Problem description is required' }, { status: 400 });
    }

    const result = await generateQuoteWithGemini(
      problem,
      tradeType || 'Plumbing',
      catalog || [],
      uploadedDocsText
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Gemini route error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
