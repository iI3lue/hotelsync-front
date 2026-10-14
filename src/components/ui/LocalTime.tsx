"use client";

import { useEffect, useState } from "react";

/** Hora local en el hotel, a partir de su zona horaria (dato real del hotel). */
export default function LocalTime({ timeZone, className = "" }: { timeZone: string; className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () => {
      try {
        return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(new Date());
      } catch {
        return null;
      }
    };
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 30_000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <span className={`tabular-nums ${className}`} suppressHydrationWarning>
      {now ?? "--:--"}
    </span>
  );
}
