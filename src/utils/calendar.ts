export function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent("Casamento de Alana & Henderson 🌸");
  const dates = "20260907T190000Z/20260908T010000Z"; // 2026-09-07 16:00 BRT to 22:00 BRT
  const details = encodeURIComponent(
    "Prepare-se para celebrar o nosso grande dia em Gramado! Esperamos você para comemorar conosco esta data tão especial.\n\nConfirme sua presença em nosso site!"
  );
  const location = encodeURIComponent("Capela das Hortênsias - Av. das Hortênsias, 1450 - Gramado, RS");
  
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

  // Generate a test alarm trigger for 2 minutes from now (for the "today" test)
  const testAlarmTime = new Date(Date.now() + 2 * 60 * 1000);
  const testAlarmString = formatDateToIcsUtc(testAlarmTime);
  const stampString = formatDateToIcsUtc(new Date());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alana e Henderson//Casamento//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:casamento-alana-henderson-2026@casamento",
    `DTSTAMP:${stampString}`,
    "DTSTART:20260907T190000Z", // 16:00 BRT
    "DTEND:20260908T010000Z",   // 22:00 BRT
    "SUMMARY:Casamento de Alana & Henderson 🌸",
    "DESCRIPTION:Prepare-se para celebrar o nosso grande dia em Gramado! Esperamos você para comemorar conosco esta data tão especial. Confirme sua presença em nosso site!",
    "LOCATION:Capela das Hortênsias - Av. das Hortênsias, 1450 - Gramado, RS",
    
    // Alerta 45 dias antes
    "BEGIN:VALARM",
    "TRIGGER:-P45D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Faltam 45 dias para o casamento de Alana & Henderson! 🌸",
    "END:VALARM",

    // Alerta 30 dias antes
    "BEGIN:VALARM",
    "TRIGGER:-P30D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Faltam 30 dias para o casamento de Alana & Henderson! 🌸",
    "END:VALARM",

    // Alerta 7 dias antes
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Faltam 7 dias (1 semana) para o casamento de Alana & Henderson! 🌸",
    "END:VALARM",

    // Alerta 5 dias antes
    "BEGIN:VALARM",
    "TRIGGER:-P5D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Faltam apenas 5 dias para o casamento de Alana & Henderson! 🌸",
    "END:VALARM",

    // Alerta 2 dias antes
    "BEGIN:VALARM",
    "TRIGGER:-P2D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Falta pouquíssimo! Faltam 2 dias para o casamento de Alana & Henderson! 🌸",
    "END:VALARM",

    // Alerta no dia exato (3 horas antes do início para preparação)
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    "DESCRIPTION:É HOJE! O casamento de Alana & Henderson é hoje! 🌸 Prepare seu melhor sorriso.",
    "END:VALARM",

    // Alerta Teste de Funcionamento para Hoje (2 minutos a partir do download do arquivo)
    "BEGIN:VALARM",
    `TRIGGER;VALUE=DATE-TIME:${testAlarmString}`,
    "ACTION:DISPLAY",
    "DESCRIPTION:🔔 Teste de Alerta: Este é o seu lembrete funcionando hoje no seu celular! Tudo pronto para o casamento de Alana & Henderson! 🌸",
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
