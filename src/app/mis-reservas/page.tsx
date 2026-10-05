import type { Metadata } from "next";
import MyBookings from "./my-bookings";

export const metadata: Metadata = {
  title: "Mis reservas — HotelSync",
  description: "Tus reservas asociadas a tu cuenta o tu correo.",
};

export default function MyBookingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <div className="border-b border-slate-100 pb-6 dark:border-brand-navy-800">
        <h1 className="font-heading text-3xl font-extrabold text-brand-navy dark:text-white md:text-4xl">
          Mis Reservas
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Revisá el estado y las fechas de tus estadías confirmadas y pendientes.
        </p>
      </div>
      <MyBookings />
    </div>
  );
}
