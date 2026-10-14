import Link from "next/link";
import { SCENES } from "@/lib/imagery";
import Photo from "./Photo";

/** Panel fotográfico de las pantallas de cuenta (entrar / crear). */
export default function AuthPanel({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="relative flex h-full min-h-[560px] flex-col justify-between overflow-hidden bg-brand-navy-900 p-10 text-white">
      <div className="absolute inset-0 animate-ken-burns">
        <Photo src={SCENES.lobby} alt="" className="h-full w-full object-cover" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/40" />

      <Link href="/" className="relative font-display text-[1.2rem] uppercase tracking-[0.32em]">
        HotelSync
      </Link>

      <div className="relative">
        <p className="max-w-sm font-display text-[2.4rem] leading-[1.1]">{title}</p>
        <ul className="mt-10 space-y-3 border-t border-white/20 pt-6">
          {points.map((f) => (
            <li key={f} className="flex items-center gap-3 text-[0.925rem] text-white/80">
              <span aria-hidden="true" className="h-px w-5 bg-brand-gold-300" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
