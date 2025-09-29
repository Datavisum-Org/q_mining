import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-coal-800/70 bg-coal-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-100">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-btc-orange/20 text-btc-orange">
            ⚡
          </span>
          HashRate IQ
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ore-300 md:flex">
          <Link href="/calculator" className="transition hover:text-slate-100">
            Calculator
          </Link>
          <Link href="/dashboard" className="transition hover:text-slate-100">
            Dashboard
          </Link>
          <Link href="/docs" className="transition hover:text-slate-100">
            Documentation
          </Link>
        </nav>
        <Link
          href="/contact"
          className="hidden rounded-lg border border-btc-orange/40 px-4 py-2 text-sm font-semibold text-btc-orange transition hover:border-btc-orange hover:bg-btc-orange/10 md:inline-flex"
        >
          Join Beta
        </Link>
      </div>
    </header>
  );
}
