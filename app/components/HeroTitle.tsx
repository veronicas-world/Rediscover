const FULL_TEXT = "A drug repurposing database for female biology.";

// Static hero headline. (Previously typed itself out on first visit; removed so
// the page reads as a scientific resource rather than a product landing page.)
export default function HeroTitle({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h1 className={className} style={style}>
      {FULL_TEXT}
    </h1>
  );
}
