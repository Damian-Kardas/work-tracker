import NavBar from "@/components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-900">
      <NavBar />
      <main className="mx-auto max-w-lg px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}
