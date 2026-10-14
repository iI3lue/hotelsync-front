import Link from "next/link";
import { fetchHotels, filterHotels, type Hotel } from "@/lib/api";
import { destinationsFrom } from "@/lib/destinations";
import { SCENES } from "@/lib/imagery";
import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import SearchBar from "@/components/SearchBar";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Photo from "@/components/ui/Photo";
import Arrow from "@/components/ui/Arrow";
import DestinationIndex from "@/components/home/DestinationIndex";

/* ─── Colección: dos columnas escalonadas ─────────────────────── */
function Collection({ hotels, city }: { hotels: Hotel[]; city?: string }) {
  const filtered = filterHotels(hotels, { city });
  if (filtered.length === 0) {
    return (
      <EmptyState
        title={city ? `Todavía no estamos en ${city}` : "La colección se está preparando"}
        description={
          city
            ? "Probá con otra ciudad o mirá todos los destinos donde ya te esperamos."
            : "En breve vas a ver acá nuestros hoteles. Volvé a intentarlo en unos minutos."
        }
        actionHref="/buscar"
        actionLabel="Ver todos los destinos"
      />
    );
  }

  if (filtered.length < 3) {
    return (
      <div className="grid grid-cols-1 gap-x-12 gap-y-20 md:grid-cols-2">
        {filtered.map((h, i) => <HotelCard key={h.hotel_id} hotel={h} index={i} />)}
      </div>
    );
  }

  // Dos columnas con la segunda desplazada (ritmo editorial); en móvil
  // conserva el orden original del catálogo.
  return (
    <div className="grid grid-cols-1 gap-x-16 gap-y-20 md:grid-cols-2 md:gap-y-28 md:pb-40 lg:gap-x-24 md:[&>*:nth-child(even)]:translate-y-40">
      {filtered.map((h, i) => (
        <div key={h.hotel_id}>
          <HotelCard hotel={h} index={i} />
        </div>
      ))}
    </div>
  );
}

/* ─── Pilares de la casa ──────────────────────────────────────── */
const PILLARS = [
  {
    eyebrow: "Mesa",
    title: "Cocina de la región",
    body: "Desayunos largos, producto de mercado y una carta que cambia con la temporada de cada ciudad.",
    image: SCENES.dining,
  },
  {
    eyebrow: "Descanso",
    title: "Tiempo para vos",
    body: "Spa, piscina o simplemente una buena cama: habitaciones pensadas para dormir de verdad.",
    image: SCENES.wellness,
  },
  {
    eyebrow: "Encuentro",
    title: "Lugares para reunirse",
    body: "Del brindis íntimo al evento de empresa, con un equipo que se ocupa de los detalles.",
    image: SCENES.gatherings,
  },
];

const DIRECT = [
  {
    title: "Tarifa oficial",
    body: "Reservás con la casa, sin intermediarios. El precio que ves es el que pagás.",
  },
  {
    title: "Confirmación inmediata",
    body: "La disponibilidad se consulta en tiempo real: si la ves libre, es tuya.",
  },
  {
    title: "Políticas a la vista",
    body: "Cancelación y condiciones de cada hotel claras antes de confirmar, no después.",
  },
];

/* ─── Page ───────────────────────────────────────────────────── */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  let hotels: Hotel[] = [];
  let failed = false;
  try {
    hotels = await fetchHotels();
  } catch {
    failed = true;
  }

  const destinations = destinationsFrom(hotels);
  const countries = Array.from(new Set(hotels.map((h) => h.country)));
  const roomTypes = hotels.reduce((n, h) => n + (h.roomTypes?.length ?? 0), 0);

  const stats = [
    { value: hotels.length, label: hotels.length === 1 ? "Hotel" : "Hoteles" },
    { value: destinations.length, label: destinations.length === 1 ? "Destino" : "Destinos" },
    { value: countries.length, label: countries.length === 1 ? "País" : "Países" },
    { value: roomTypes, label: "Tipos de habitación" },
  ].filter((s) => s.value > 0);

  return (
    <div>
      {/* ── 1. Hero inmersivo ── */}
      <section aria-labelledby="hero-title" className="relative isolate flex h-[92svh] min-h-[620px] items-end overflow-hidden bg-brand-navy-950 text-white">
        <ParallaxImage src={SCENES.hero} alt="Piscina al atardecer en uno de nuestros hoteles" priority strength={160} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30" />
        {/* Cortina de entrada */}
        <div aria-hidden="true" className="absolute inset-0 z-10 origin-top animate-curtain-up bg-brand-navy-950" />

        <div className="shell relative z-20 pb-28 md:pb-36">
          <p className="mask-line text-eyebrow uppercase text-white/80">
            <span style={{ ["--d" as string]: "700ms" }}>
              {countries.length > 0 ? countries.join(" · ") : "Hoteles de autor"}
            </span>
          </p>
          <h1 id="hero-title" className="mt-6 font-display text-display-lg">
            <span className="mask-line"><span style={{ ["--d" as string]: "800ms" }}>Hoteles con</span></span>
            <span className="mask-line"><span style={{ ["--d" as string]: "920ms" }}>sentido de lugar.</span></span>
          </h1>
          <div className="mt-8 grid items-end gap-8 md:grid-cols-[minmax(0,30rem)_1fr]">
            <p className="animate-slide-up text-[1.05rem] leading-relaxed text-white/80" style={{ animationDelay: "1150ms" }}>
              Cada casa tiene el carácter de su ciudad: cocina local, habitaciones para descansar de verdad
              y un equipo que conoce el barrio. Qué bueno que estés acá.
            </p>
            <div className="hidden items-center justify-end gap-4 md:flex">
              <span className="text-eyebrow uppercase text-white/60">Desplazate</span>
              <span className="relative block h-14 w-px overflow-hidden bg-white/20">
                <span className="absolute inset-0 animate-scroll-cue bg-white" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de reserva anclada al pie del hero */}
      <div className="shell relative z-30 -mt-14 animate-slide-up md:-mt-[46px]" style={{ animationDelay: "1250ms" }}>
        <SearchBar initialCity={city ?? ""} heroMode />
      </div>

      {/* ── 2. Introducción ── */}
      <section aria-labelledby="intro-title" className="shell pb-8 pt-28 md:pt-40">
        <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
          <p className="eyebrow" data-reveal="fade">La casa</p>
          <div>
            <h2 id="intro-title" data-reveal="" className="max-w-4xl font-display text-[clamp(1.75rem,3.4vw,2.9rem)] leading-[1.2] text-brand-navy dark:text-white">
              Somos una colección pequeña de hoteles. Nos gusta la arquitectura que respeta su ciudad,
              los desayunos sin apuro y las reservas sin vueltas.
            </h2>
            {stats.length > 0 && (
              <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={s.label} data-reveal="" style={{ ["--reveal-delay" as string]: `${i * 80}ms` }} className="flex flex-col">
                    <span data-reveal="line" className="order-0 block h-px bg-brand-navy/20 dark:bg-white/20" />
                    <dt className="order-2 mt-3 eyebrow">{s.label}</dt>
                    <dd className="order-1 mt-5 font-display text-[3.25rem] leading-none tabular-nums text-brand-navy dark:text-white">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. Colección ── */}
      <section id="hoteles" aria-labelledby="listing-title" className="shell scroll-mt-24 pt-24 md:pt-36">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6 md:mb-20">
          <div>
            <p className="eyebrow" data-reveal="fade">La colección</p>
            <h2 id="listing-title" data-reveal="" className="mt-4 font-display text-display-md text-brand-navy dark:text-white">
              {city ? `Hoteles en ${city}` : "Nuestros hoteles"}
            </h2>
          </div>
          <Link href="/buscar" className="link-line text-brand-navy dark:text-white">
            Ver todos los hoteles <Arrow className="h-2.5 w-5" />
          </Link>
        </div>

        {failed ? (
          <EmptyState
            title="No pudimos cargar los hoteles"
            description="El catálogo no responde en este momento. Probá de nuevo en unos minutos."
            actionHref="/"
            actionLabel="Reintentar"
          />
        ) : (
          <Collection hotels={hotels} city={city} />
        )}
      </section>

      {/* ── 4. Pilares ── */}
      <section aria-labelledby="pillars-title" className="shell pt-32 md:pt-48">
        <div className="mb-16 grid gap-6 lg:grid-cols-[14rem_1fr]">
          <p className="eyebrow" data-reveal="fade">Estar en HotelSync</p>
          <h2 id="pillars-title" data-reveal="" className="max-w-2xl font-display text-display-md text-brand-navy dark:text-white">
            Lo que encontrás en todas nuestras casas
          </h2>
        </div>
        <div className="grid gap-x-8 gap-y-16 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <article key={p.title} className={i === 1 ? "md:pt-24" : ""}>
              <div data-reveal="image" style={{ ["--reveal-delay" as string]: `${i * 120}ms` }} className="relative aspect-[3/4] overflow-hidden bg-brand-stone dark:bg-brand-navy-800">
                <Photo src={p.image} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div data-reveal="" style={{ ["--reveal-delay" as string]: `${i * 120 + 150}ms` }} className="pt-7">
                <p className="eyebrow">{p.eyebrow}</p>
                <h3 className="mt-3 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white">{p.title}</h3>
                <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-brand-navy/65 dark:text-white/60">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── 5. Destinos ── */}
      {destinations.length > 0 && (
        <section aria-labelledby="dest-title" className="mt-32 overflow-hidden bg-brand-navy-900 py-24 text-white md:mt-48 md:py-32">
          <div className="shell">
            <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-eyebrow uppercase text-white/50" data-reveal="fade">Destinos</p>
                <h2 id="dest-title" data-reveal="" className="mt-4 font-display text-display-md">¿A dónde vamos?</h2>
              </div>
              <p data-reveal="fade" className="max-w-xs text-[0.95rem] text-white/60">
                Elegí una ciudad y te mostramos dónde quedarte, con disponibilidad real.
              </p>
            </div>
            <DestinationIndex destinations={destinations} />
          </div>
        </section>
      )}

      {/* ── 6. Reservar directo ── */}
      <section aria-labelledby="direct-title" className="shell pt-32 md:pt-44">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow" data-reveal="fade">Reservar directo</p>
            <h2 id="direct-title" data-reveal="" className="mt-4 max-w-md font-display text-display-sm text-brand-navy dark:text-white">
              ¿Por qué reservar con nosotros y no en otro lado?
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {DIRECT.map((d, i) => (
              <div key={d.title} data-reveal="" style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                <span data-reveal="line" className="block h-px bg-brand-gold" />
                <h3 className="mt-6 font-display text-[1.4rem] leading-tight text-brand-navy dark:text-white">{d.title}</h3>
                <p className="mt-3 text-[0.925rem] leading-relaxed text-brand-navy/65 dark:text-white/60">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Cierre ── */}
      <section aria-labelledby="cta-title" className="relative -mb-28 mt-32 overflow-hidden md:mt-44">
        <div data-reveal="image" className="relative h-[78svh] min-h-[480px] bg-brand-navy-900">
          <Photo src={SCENES.pool} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-black/40" />
          <div className="shell relative flex h-full flex-col items-start justify-end pb-20 text-white md:pb-28">
            <h2 id="cta-title" className="max-w-3xl font-display text-display-md">
              Tu próxima estancia empieza con una fecha.
            </h2>
            <Link href="/buscar" className="btn-light mt-10">
              Elegir fechas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
