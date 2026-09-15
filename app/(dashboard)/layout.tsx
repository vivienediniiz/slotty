import Link from "next/link";

const NAV_ITEMS = [
  { href: "/schedule", label: "Agendamento" },
  { href: "/connections", label: "Conexões" }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-black/5 px-5 py-8 md:flex">
        <span className="mb-10 text-xl font-bold text-gradient-brand">Slotty</span>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-brand-ink/70 transition hover:bg-white hover:text-brand-ink hover:shadow-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  );
}
