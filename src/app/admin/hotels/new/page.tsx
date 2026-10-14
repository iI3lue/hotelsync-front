import { redirect } from "next/navigation";
import HotelForm from "@/components/HotelForm";
import { getSessionScope } from "@/lib/server-session";

export default async function NewHotelPage() {
  // Crear hoteles es SUPER_ADMIN (el backend lo rechaza con 403).
  const session = await getSessionScope();
  if (session.role === "MANAGER") {
    redirect("/admin/hotels");
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Agregar hotel</h1>
      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
        <HotelForm />
      </div>
    </div>
  );
}
