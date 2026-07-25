import Link from "next/link";
import { UsageMeter } from "@/components/UsageMeter";

export default function Home() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <span className="text-[11px] tracking-[0.16em] text-muted uppercase">
          Tu closet, reinventado
        </span>
        <h1 className="font-serif text-5xl leading-[0.95] font-semibold text-foreground">
          Percha
        </h1>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted">
          Lo que ya tienes rinde mas de lo que crees. Te ayudamos a usarlo.
        </p>
      </header>

      <div
        aria-hidden
        className="flex aspect-4/5 w-full items-center justify-center rounded-[4px]"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in oklch, var(--accent) 22%, var(--surface)), color-mix(in oklch, var(--accent-2) 20%, var(--surface)))",
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-foreground/40">
          <path
            d="M12 3a2 2 0 1 1 2 2v1.5l7.5 4.5a1 1 0 0 1-.4 1.85L12 15l-9.1-2.15a1 1 0 0 1-.4-1.85L10 6.5V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M4 15l-1.5 5.5A1 1 0 0 0 3.5 22h17a1 1 0 0 0 1-1.5L20 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-2.5">
        <Link
          href="/closet"
          className="rounded-[2px] bg-accent py-4 text-center text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ver mi closet
        </Link>
        <Link
          href="/outfit"
          className="rounded-[2px] border border-foreground py-4 text-center text-[15px] font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Armar outfit
        </Link>
      </div>

      <UsageMeter />
    </div>
  );
}
