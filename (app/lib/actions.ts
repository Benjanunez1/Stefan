// Acciones "nivel Simple": preparan todo y dejan que Benja confirme con un clic.

export function abrirWhatsApp(numero: string, mensaje: string) {
  const numeroLimpio = numero.replace(/[^\d]/g, "");
  const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

export function abrirCorreo(destinatario: string, asunto: string, cuerpo: string) {
  const mailto = `mailto:${encodeURIComponent(destinatario)}?subject=${encodeURIComponent(
    asunto
  )}&body=${encodeURIComponent(cuerpo)}`;
  window.open(mailto);
}

export function abrirEventoCalendario(
  titulo: string,
  detalle: string,
  lugar: string,
  inicioISO: string,
  finISO: string
) {
  const toGCal = (iso: string) => iso.replace(/[-:]/g, "").split(".")[0] + "Z";
  const fechas = `${toGCal(inicioISO)}/${toGCal(finISO)}`;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    titulo
  )}&dates=${fechas}&details=${encodeURIComponent(detalle)}&location=${encodeURIComponent(
    lugar
  )}`;
  window.open(url, "_blank");
}

export function abrirInstagram() {
  // Intenta abrir la app; si no está instalada, el navegador cae a la web.
  window.location.href = "instagram://app";
  setTimeout(() => {
    window.open("https://www.instagram.com", "_blank");
  }, 700);
}

export function abrirYouTube(busqueda?: string) {
  const url = busqueda
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(busqueda)}`
    : "https://www.youtube.com";
  window.open(url, "_blank");
}

// --- Recordatorios: guardados en el propio celular (localStorage) ---

export type Recordatorio = {
  id: string;
  texto: string;
  creado: string;
};

const KEY = "stefan_recordatorios";

export function guardarRecordatorio(texto: string): Recordatorio {
  const nuevo: Recordatorio = {
    id: crypto.randomUUID(),
    texto,
    creado: new Date().toISOString(),
  };
  const lista = obtenerRecordatorios();
  lista.push(nuevo);
  localStorage.setItem(KEY, JSON.stringify(lista));
  return nuevo;
}

export function obtenerRecordatorios(): Recordatorio[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function borrarRecordatorio(id: string) {
  const lista = obtenerRecordatorios().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(lista));
}
