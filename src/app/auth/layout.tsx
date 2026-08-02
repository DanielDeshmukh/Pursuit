import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center" style={{ backgroundColor: "#0a1929" }}>
        <Link href="/" className="flex items-center gap-3 text-4xl font-semibold text-white">
          <Image src="/favicon.png" alt="" width={40} height={40} />
          Pursuit
        </Link>
        <p className="mt-4 max-w-xs text-center text-sm text-blue-200/60">
          Your job search, tracked, automated, and actually organized.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-2xl font-semibold text-ink lg:hidden"
        >
          <Image src="/favicon.png" alt="" width={32} height={32} />
          Pursuit
        </Link>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
