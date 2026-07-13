import Link from "next/link";
import Image from "next/image";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2.5 rounded-xl font-display text-lg font-bold" aria-label="BizGuide AI home">
      <span className="grid size-11 place-items-center overflow-hidden rounded-xl border border-[#53e0ff]/20 bg-[#050816] shadow-[0_8px_24px_rgba(83,224,255,.16)]">
        <Image src="/brand/bizguide-logo.png" alt="" width={52} height={52} className="max-w-none scale-[1.32]" priority />
      </span>
      <span>BizGuide <span className="text-[#53e0ff]">AI</span></span>
    </Link>
  );
}
