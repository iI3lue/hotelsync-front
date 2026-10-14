import AppShell from "@/components/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] pb-16">
      <AppShell />
      {children}
    </div>
  );
}
