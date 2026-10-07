import NavBar from "@/components/NavBar";
import BottomTabBar from "@/components/BottomTabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment">
      <NavBar />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-5">{children}</main>
      <BottomTabBar />
    </div>
  );
}
