import Link from "next/link";
import { UsageMeter } from "@/components/UsageMeter";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Percha</h1>
        <p className="mt-1 text-sm text-muted">
          Lo que ya tienes rinde mas de lo que crees. Te ayudamos a usarlo.
        </p>
      </header>

      <UsageMeter />

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/closet"
          className="rounded-2xl border border-border bg-surface p-5 text-center font-medium text-foreground transition-colors hover:border-accent"
        >
          Ver mi closet
        </Link>
        <Link
          href="/outfit"
          className="rounded-2xl bg-accent p-5 text-center font-medium text-white transition-opacity hover:opacity-90"
        >
          Armar outfit
        </Link>
      </div>
    </div>
  );
}
