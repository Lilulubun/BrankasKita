import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'API key tidak ditemukan.' }, { status: 500 });
    }
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ reply: 'Format messages tidak valid.' }, { status: 400 });
    }
    
    // read knowledge base from CSV
    const csvPath = path.join(process.cwd(), 'src', 'data', 'helpuser.csv');
    let knowledge = '';
    try {
      knowledge = fs.readFileSync(csvPath, 'utf8');
    } catch (e) {
      knowledge = '';
    }

    // add knowledge base to the system prompt
    const systemPrompt = {
      role: 'system',
      content: `Berikut knowledge base BrankasKita:\n${knowledge}\nPelajari data tersebut dan gunakan untuk menjawab pertanyaan dari pengguna sesuai dengan konteks yang ditanyakan.
      Setiap kali pengguna mengajukan pertanyaan, pahami terlebih dahulu konteksnya, lalu berikan jawaban yang relevan berdasarkan data di atas. Gunakan bahasa inggris yang baik dan benar.`,
    };

    // change the first user message to a system prompt
    const userMessages = messages.filter((msg: any) => msg.role !== 'system');
    const geminiMessages = [systemPrompt, ...userMessages].map((msg: { role: string, content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json({ reply: 'Error dari Gemini: ' + errText }, { status: 500 });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, terjadi kesalahan.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ reply: 'Internal error: ' + error?.message }, { status: 500 });
  }
}