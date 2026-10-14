"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me, updateMe, type AuthProfile } from "@/lib/auth-client";
import { useToast } from "@/components/Toast";
import Spinner from "@/components/Spinner";

function Avatar({ profile }: { profile: AuthProfile }) {
  if (profile.picture_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={profile.picture_url}
        alt={`Foto de ${profile.name}`}
        referrerPolicy="no-referrer"
        className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-gold/40"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-20 items-center justify-center rounded-full border border-brand-gold font-display text-2xl text-brand-navy dark:text-white"
    >
      {profile.email.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ProfileForm() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void me().then((p) => {
      if (!p) {
        router.replace("/cuenta/entrar?returnTo=/cuenta/perfil");
        return;
      }
      setProfile(p);
      setName(p.name);
      setPhone(p.phone ?? "");
      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMe({
        ...(name.trim() && name.trim() !== profile?.name ? { name: name.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      setProfile(updated);
      success("Perfil actualizado");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar el perfil";
      setError(msg);
      toastError("No se pudo guardar", msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Cargando perfil…" />
      </div>
    );
  }

  return (
    <div className="border border-brand-navy/10 bg-white p-6 dark:border-white/10 dark:bg-brand-navy-800 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <Avatar profile={profile} />
        <div className="min-w-0">
          <p className="truncate font-display text-[1.6rem] leading-tight text-brand-navy dark:text-white">
            {profile.name}
          </p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {profile.email}
          </p>
          {profile.picture_url && (
            <p className="mt-0.5 text-xs text-gray-400">
              Foto sincronizada desde Google
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="animate-notice-in mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="profile-email" className="input-label">
            Correo electrónico
          </label>
          <input
            id="profile-email"
            type="email"
            value={profile.email}
            disabled
            className="input-field opacity-60"
          />
          <p className="mt-1 text-xs text-gray-400">
            El correo identifica tu cuenta y no se puede cambiar.
          </p>
        </div>

        <div>
          <label htmlFor="profile-name" className="input-label">
            Nombre
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="input-label">
            Teléfono {!profile.phone && <span className="text-brand-gold">(completalo)</span>}
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+54 11 1234-5678"
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-400">
            Lo usamos para contactarte por tu reserva.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full justify-center"
        >
          {saving ? <Spinner label="Guardando…" /> : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
