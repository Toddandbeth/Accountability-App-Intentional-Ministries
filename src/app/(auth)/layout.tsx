import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-brand-light/25 px-4 py-8">
      <Image
        src="/brand/IM_-_Main.png"
        alt="Intentional Ministries"
        width={1076}
        height={917}
        priority
        className="mb-6 h-auto w-40"
      />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
