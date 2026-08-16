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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Falta configurar ANTHROPIC_API_KEY en .env.local" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [...(history || []), { role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Error de la API de Claude: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: any) => c.type === "text");

    return NextResponse.json({ reply: textBlock?.text || "" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error desconocido" },
      { status: 500 }
    );
  }
  }
