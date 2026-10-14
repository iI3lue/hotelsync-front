"use client";

import { useEffect, useRef, useState } from "react";

interface PhotoProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * <img> con aparición suave al cargar y respaldo silencioso si la URL
 * falla (queda el fondo de piedra del contenedor, nunca el ícono roto).
 */
export default function Photo({ src, alt, className = "", priority = false }: PhotoProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
    else setLoaded(false);
  }, [src]);

  if (failed) return <span aria-hidden="true" className={`block bg-brand-stone dark:bg-brand-navy-800 ${className}`} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`img-fade ${loaded ? "is-loaded" : ""} ${className}`}
    />
  );
}
