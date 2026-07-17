export function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent("Casamento de Alana & Henderson 🌸");
  const dates = "20260907T180000Z/20260908T010000Z"; // 15:00 BRT (18:00 UTC) to 22:00 BRT
  const details = encodeURIComponent(
    "Prepare-se para celebrar o nosso grande dia! Esperamos você para comemorar conosco esta data tão especial.\n\nConfirme sua presença em nosso site!"
  );
  const location = encodeURIComponent("Prime Eventos - R. Deoclécio Brito, 3399 - Planalto");
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function downloadIcsFile(): void {
  // Helper to format Date to UTC ICS format: YYYYMMDDTHHMMSSZ
  function formatDateToIcsUtc(date: Date): string {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
  }

  const stampString = formatDateToIcsUtc(new Date());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alana e Henderson//Casamento//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:casamento-alana-henderson-2026@casamento",
    `DTSTAMP:${stampString}`,
    "DTSTART:20260907T180000Z", // 15:00 BRT
    "DTEND:20260908T010000Z",   // 22:00 BRT
    "SUMMARY:Casamento de Alana & Henderson 🌸",
    "DESCRIPTION:Prepare-se para celebrar o nosso grande dia! Esperamos você para comemorar conosco esta data tão especial.",
    "LOCATION:Prime Eventos - R. Deoclécio Brito, 3399 - Planalto",
    
    // Alerta 7 dias antes
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Faltam 7 dias (1 semana) para o casamento de Alana & Henderson! 🌸",
    "END:VALARM",

    // Alerta no dia exato (3 horas antes do início para preparação)
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    "DESCRIPTION:É HOJE! O casamento de Alana & Henderson é hoje às 15:00! 🌸 Prepare seu melhor sorriso.",
    "END:VALARM",

    // Alerta no dia exato (no momento do início)
    "BEGIN:VALARM",
    "TRIGGER:PT0S",
    "ACTION:DISPLAY",
    "DESCRIPTION:Começou! O casamento de Alana & Henderson está iniciando na Prime Eventos. 🌸",
    "END:VALARM",

    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "casamento-alana-henderson.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
