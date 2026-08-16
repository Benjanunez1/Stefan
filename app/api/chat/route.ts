import { NextRequest, NextResponse } from "next/server";

const USER_NAME = "Benja";
const ASSISTANT_NAME = "Stefan";

const SYSTEM_PROMPT = `Sos ${ASSISTANT_NAME}, el asistente de voz personal de ${USER_NAME}.
Hablás en español rioplatense, con respuestas cortas y naturales (esto se lee en voz alta, no es texto para leer en pantalla).
Cuando ${USER_NAME} te pida abrir una app (Instagram, YouTube) o preparar un mensaje de WhatsApp, un correo o un evento de calendario, describí la acción que estás por dejar lista para que él la confirme con un clic (por ejemplo "te dejo preparado el mensaje de WhatsApp para que lo confirmes" en vez de "ya lo envié"), porque vos nunca enviás nada solo, siempre necesita su confirmación.
Si te pide que recuerdes algo, confirmá que lo guardaste.
No inventes que hiciste acciones que no podés hacer.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Falta configurar GEMINI_API_KEY en Vercel" },
        { status: 500 }
      );
    }

    const contents = [
      ...(history || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Error de la API de Gemini: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
