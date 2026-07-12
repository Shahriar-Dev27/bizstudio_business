import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2.5 rounded-xl font-display text-lg font-bold" aria-label="BizGuide AI home">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#53e0ff] to-[#7c5cff] text-white shadow-[0_8px_24px_rgba(83,224,255,.2)]">
        <BarChart3 size={21} aria-hidden="true" />
      </span>
      <span>BizGuide <span className="text-[#53e0ff]">AI</span></span>
    </Link>
  );
}
