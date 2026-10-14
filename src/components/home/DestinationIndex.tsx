"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import type { Destination } from "@/lib/destinations";
import Arrow from "@/components/ui/Arrow";

/**
 * Índice de destinos en tipografía grande. En escritorio, al pasar por
 * una ciudad aparece su foto siguiendo al cursor; en móvil se muestra
 * una miniatura fija en cada fila.
 */
export default function DestinationIndex({ destinations }: { destinations: Destination[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 24, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 24, mass: 0.6 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  const byCountry = destinations.reduce<Record<string, { d: Destination; i: number }[]>>((acc, d, i) => {
    (acc[d.country] ??= []).push({ d, i });
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
      {Object.entries(byCountry).map(([country, items]) => (
        <div key={country} className="grid gap-x-10 border-t border-white/15 pt-6 lg:grid-cols-[12rem_1fr]">
          <h3 className="text-eyebrow uppercase text-white/45">{country}</h3>
          <ul className="pb-6">
            {items.map(({ d, i }) => (
              <li key={d.city} className="border-b border-white/10 last:border-b-0">
                <Link
                  href={`/buscar?city=${encodeURIComponent(d.city)}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group grid grid-cols-[4.5rem_1fr] items-center gap-5 py-5 sm:grid-cols-[1fr_auto] lg:py-6"
                >
                  {/* Miniatura móvil */}
                  <span className="relative aspect-square overflow-hidden bg-white/5 sm:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[2rem] leading-none transition-[transform,color] duration-700 ease-silk group-hover:translate-x-3 group-hover:text-brand-gold-300 sm:text-[clamp(2.5rem,5vw,4.25rem)]">
                      {d.city}
                    </span>
                    <span className="mt-2 block max-w-md text-[0.9rem] text-white/55 transition-colors duration-500 group-hover:text-white/80">
                      {d.line}
                    </span>
                  </span>
                  <span className="hidden items-center gap-4 text-eyebrow uppercase text-white/50 sm:flex">
                    {d.hotels} {d.hotels === 1 ? "hotel" : "hoteles"}
                    <Arrow className="h-2.5 w-5 -translate-x-2 opacity-0 transition-all duration-500 ease-silk group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Foto flotante (solo puntero fino) */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          style={{ x: sx, y: sy }}
          className="pointer-events-none absolute left-0 top-0 z-10 hidden [@media(hover:hover)]:lg:block"
        >
          <AnimatePresence>
            {active !== null && (
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute overflow-hidden shadow-elevated"
                style={{ width: 280, height: 360, left: 40, top: -180 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={destinations[active].image} alt="" className="h-full w-full object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
