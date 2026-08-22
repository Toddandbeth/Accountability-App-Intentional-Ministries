export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-y-auto bg-brand-light/25 px-4 py-8">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
