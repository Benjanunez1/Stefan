"use client";

import { useEffect, useRef, useState } from "react";
import Nucleo, { EstadoNucleo } from "./components/Nucleo";
import {
  abrirWhatsApp,
  abrirInstagram,
  abrirYouTube,
  guardarRecordatorio,
  obtenerRecordatorios,
  borrarRecordatorio,
  Recordatorio,
} from "./lib/actions";

const USER_NAME = "Benja";
const ASSISTANT_NAME = "Stefan";
const IDIOMA_RECONOCIMIENTO = "es-419";

type Mensaje = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [estado, setEstado] = useState<EstadoNucleo>("inactivo");
  const [amplitud, setAmplitud] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>();
  const estadoRef = useRef<EstadoNucleo>("inactivo");

  useEffect(() => {
    setRecordatorios(obtenerRecordatorios());
  }, []);

  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  const medirAmplitud = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
    setAmplitud(avg);
    rafRef.current = requestAnimationFrame(medirAmplitud);
  };

  const iniciarEscucha = () => {
    setError("");
    setTranscript("");
    setRespuesta("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Tu navegador no soporta reconocimiento de voz. Probá con Chrome en Android."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_RECONOCIMIENTO;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript;
      setTranscript(texto);
      procesarMensaje(texto);
    };

    recognition.onerror = (event: any) => {
      setError(`No te escuché bien (${event.error}). Probá de nuevo.`);
      detenerEscucha();
    };

    recognition.onend = () => {
      if (estadoRef.current === "escuchando") {
        setEstado("inactivo");
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setEstado("escuchando");
    } catch (e) {
      setError("No pude iniciar el micrófono. Probá tocar 'Hablar' de nuevo.");
      return;
    }

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
        medirAmplitud();
      })
      .catch(() => {});
  };

  const detenerEscucha = () => {
    recognitionRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close();
    setAmplitud(0);
    setEstado("inactivo");
  };

  const procesarMensaje = async (texto: string) => {
    detenerEscucha();
    setEstado("procesando");

    const nuevosMensajes: Mensaje[] = [
      ...mensajes,
      { role: "user", content: texto },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texto,
          history: mensajes.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setEstado("inactivo");
        return;
      }

      const reply = data.reply as string;
      setRespuesta(reply);
      setMensajes([...nuevosMensajes, { role: "assistant", content: reply }]);

      await hablar(reply);
    } catch (err: any) {
      setError("No pude conectar con Stefan. Revisá tu conexión.");
      setEstado("inactivo");
    }
  };

  const hablar = async (texto: string) => {
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No pude generar la voz.");
        setEstado("inactivo");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      audioCtxRef.current = audioCtx;

      setEstado("hablando");
      medirAmplitud();

      audio.onended = () => {
        setEstado("inactivo");
        setAmplitud(0);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        audioCtx.close();
      };

      audio.play();
    } catch {
      setError("No pude reproducir la voz de Stefan.");
      setEstado("inactivo");
    }
  };

  const agregarRecordatorio = () => {
    const texto = prompt("¿Qué querés que recuerde?");
    if (!texto) return;
    guardarRecordatorio(texto);
    setRecordatorios(obtenerRecordatorios());
  };

  const eliminarRecordatorio = (id: string) => {
    borrarRecordatorio(id);
    setRecordatorios(obtenerRecordatorios());
  };

  const abrirWhatsAppRapido = () => {
    const numero = prompt("¿A qué número le escribimos? (con código de país)");
    if (!numero) return;
    const mensaje = prompt("¿Qué mensaje querés dejar preparado?") || "";
    abrirWhatsApp(numero, mensaje);
  };

  const abrirYouTubeRapido = () => {
    const busqueda = prompt("¿Qué querés buscar en YouTube?") || "";
    abrirYouTube(busqueda);
  };

  return (
    <main className="min-h-screen bg-base-bg text-core flex flex-col items-center justify-between py-10 px-4 font-body">
      <div className="text-center">
        <h1 className="font-display text-2xl text-core tracking-wide">
          {ASSISTANT_NAME}
        </h1>
        <p className="font-mono text-xs text-core-blue mt-1 uppercase tracking-widest">
          {estado}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Nucleo estado={estado} amplitud={amplitud} />
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {transcript && (
          <p className="text-sm text-core-bright font-body text-center">
            "{transcript}"
          </p>
        )}
        {respuesta && (
          <p className="text-sm text-core font-body text-center opacity-80">
            {ASSISTANT_NAME}: {respuesta}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-400 font-mono text-center">{error}</p>
        )}

        <button
          onClick={estado === "escuchando" ? detenerEscucha : iniciarEscucha}
          className="w-20 h-20 rounded-full bg-core-blue/20 border border-core-blue flex items-center justify-center font-mono text-xs text-core-bright active:scale-95 transition"
        >
          {estado === "escuchando" ? "Parar" : "Hablar"}
        </button>

        <div className="flex flex-wrap gap-2 justify-center mt-2">
          <BotonRapido texto="WhatsApp" onClick={abrirWhatsAppRapido} />
          <BotonRapido texto="Instagram" onClick={abrirInstagram} />
          <BotonRapido texto="YouTube" onClick={abrirYouTubeRapido} />
          <BotonRapido texto="Recordar" onClick={agregarRecordatorio} />
        </div>

        {recordatorios.length > 0 && (
          <div className="w-full mt-4">
            <p className="font-mono text-xs text-core-blue mb-2">
              RECORDATORIOS
            </p>
            <ul className="flex flex-col gap-1">
              {recordatorios.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between items-center text-xs font-body bg-base-panel border border-core-blue/30 rounded px-3 py-2"
                >
                  <span>{r.texto}</span>
                  <button
                    onClick={() => eliminarRecordatorio(r.id)}
                    className="text-core-accent ml-2"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

function BotonRapido({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-mono border border-core-blue/40 text-core-bright px-3 py-2 rounded-full active:scale-95 transition"
    >
      {texto}
    </button>
  );
        }
