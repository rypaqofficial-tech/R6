import { useEffect, useState } from "react";

type Props = {
  /** Image classes — use `h-9 w-auto max-w-[…]` for wide wordmark logos */
  markClassName?: string;
  /** Wordmark next to the icon (shown only when using mark-only `logo.svg`) */
  wordmarkClassName?: string;
  className?: string;
};

/**
 * Brand logo. `public/brand/logo.jpg` (or `.png`) should be your full wordmark asset.
 * Falls back to `logo.svg` + “RYPAQ” text if raster logos are missing.
 */
export default function BrandLockup({
  markClassName = "h-9 w-auto max-h-9 max-w-[min(42vw,200px)] sm:max-w-[220px]",
  wordmarkClassName = "text-xl font-bold tracking-tight text-foreground",
  className = "flex items-center gap-2.5",
}: Props) {
  const [logoSrc, setLogoSrc] = useState("/brand/logo.jpg");
  const [showWordmark, setShowWordmark] = useState(false);

  useEffect(() => {
    setShowWordmark(logoSrc.endsWith(".svg"));
  }, [logoSrc]);

  return (
    <div className={className} aria-label="Rypaq">
      <img
        src={logoSrc}
        alt="Rypaq"
        className={`${markClassName} shrink-0 object-contain object-left`}
        onError={() => {
          setLogoSrc((prev) => {
            if (prev.endsWith(".jpg")) return "/brand/logo.png";
            if (prev.endsWith(".png")) return "/brand/logo.svg";
            return prev;
          });
        }}
      />
      {showWordmark ? <span className={wordmarkClassName}>RYPAQ</span> : null}
    </div>
  );
}
