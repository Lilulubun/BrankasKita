// src/app/api/report-ai/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('API route hit:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    console.log('Checking authentication...');
    
    // First, check if the user making the request is an authenticated admin.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Session found for user:', session.user.id);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('User query error:', userError);
      return NextResponse.json({ error: 'User query failed' }, { status: 500 });
    }
    
    if (!userData?.is_admin) {
      console.log('User is not admin:', userData);
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    console.log('User is admin, proceeding with request');

    // Parse the request body
    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));
    
    const { reportData, messages } = requestBody;
    
    if (!reportData || !messages) {
      return NextResponse.json({ error: 'Missing reportData or messages' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are a helpful business analyst for "Brankas Kita". Analyze this weekly report and answer questions.
      Report Data: ${JSON.stringify(reportData)}`,
    };

    const geminiMessages = [systemPrompt, ...messages].map((msg: { role: string, content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log('Calling Gemini API...');

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiMessages }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      throw new Error('Error from Gemini API: ' + errText);
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process that request.';

    console.log('Successfully processed request');
    return NextResponse.json({ reply });

  } catch (error: unknown) {
    console.error('API route error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Add a GET handler for testing
export async function GET(req: NextRequest) {
  console.log('GET request to API route');
  return NextResponse.json({ message: 'API route is working' });
}