import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-brand-light/25" style={{ paddingBottom: "calc(52px + env(safe-area-inset-bottom))" }}>
      <div className="mx-auto max-w-md px-4 py-6">{children}</div>
      <BottomNav />
    </div>
  );
}
