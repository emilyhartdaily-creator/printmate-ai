import { NextRequest, NextResponse } from 'next/server';

const MAX_PROMPT_LENGTH = 500;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt =
    typeof (body as { prompt?: unknown }).prompt === 'string'
      ? ((body as { prompt: string }).prompt ?? '').trim()
      : '';

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const provider = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase();

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'IMAGE_PROVIDER is "openai" but OPENAI_API_KEY is not configured',
        },
        { status: 503 },
      );
    }
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          size: '1024x1024',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('[studio openai error]', res.status, text.slice(0, 300));
        return NextResponse.json(
          { error: 'Image generation failed' },
          { status: 502 },
        );
      }
      const data = (await res.json()) as {
        data?: Array<{ url?: string }>;
      };
      const url = data.data?.[0]?.url;
      if (!url) {
        return NextResponse.json(
          { error: 'Image generation returned no URL' },
          { status: 502 },
        );
      }
      return NextResponse.json({ imageUrl: url });
    } catch (err) {
      console.error('[studio openai threw]', err);
      return NextResponse.json(
        { error: 'Image generation failed' },
        { status: 502 },
      );
    }
  }

  // Default: Pollinations (free, no key needed).
  // Enhance the raw prompt with print-design quality modifiers so the art
  // looks like a real merch graphic, not a random illustration.
  const enhancedPrompt =
    `professional t-shirt graphic design, vector-style illustration, ` +
    `bold clean shapes, high contrast, centered composition, ` +
    `isolated on a plain white background, print-ready artwork: ${prompt}`;
  const seed = Math.floor(Math.random() * 1_000_000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    enhancedPrompt,
  )}?width=1024&height=1024&seed=${seed}&nologo=true`;
  return NextResponse.json({ imageUrl });
}
