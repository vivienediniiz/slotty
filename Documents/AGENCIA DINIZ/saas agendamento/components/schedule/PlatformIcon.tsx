import type { Platform } from "@/types";

// Ícones simplificados (stroke) para não depender de um pacote de ícones no MVP.
// Troque por lucide-react/heroicons quando o projeto for além do protótipo.
const PATHS: Record<Platform, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="7" y1="10" x2="7" y2="17" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <path d="M11 17v-4.5c0-1.4 1-2.5 2.5-2.5s2.5 1.1 2.5 2.5V17" />
    </>
  ),
  threads: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8.5c3-1 6 0 6 3.5s-3 4.5-6 3.5" />
    </>
  )
};

export function PlatformIcon({
  platform,
  className = "h-4 w-4"
}: {
  platform: Platform;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[platform]}
    </svg>
  );
}
