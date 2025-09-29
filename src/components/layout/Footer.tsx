export function Footer() {
  return (
    <footer className="border-t border-coal-800/70 bg-coal-900/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-ore-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} HashRate IQ. All rights reserved.</p>
        <div className="flex gap-4">
          <a
            href="https://twitter.com"
            className="hover:text-slate-100"
            rel="noreferrer"
            target="_blank"
          >
            Twitter
          </a>
          <a href="mailto:hello@hashrateiq.com" className="hover:text-slate-100">
            Contact
          </a>
          <a href="/privacy" className="hover:text-slate-100">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
