import Link from "next/link";

export function MarketingBrand(): React.JSX.Element {
  return (
    <Link href="/" className="mk-wordmark" aria-label="BizGuide AI home">
      <span>BizGuide</span>
      <span className="mk-wordmark-ai" aria-hidden="true">AI</span>
    </Link>
  );
}
