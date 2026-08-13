import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-50 pb-16">
      <div className="mx-auto max-w-md px-4 py-6">{children}</div>
      <BottomNav />
    </div>
  );
}
