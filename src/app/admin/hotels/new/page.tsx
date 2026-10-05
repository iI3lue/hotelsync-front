import HotelForm from "@/components/HotelForm";

export default function NewHotelPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Agregar hotel</h1>
      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
        <HotelForm />
      </div>
    </div>
  );
}
