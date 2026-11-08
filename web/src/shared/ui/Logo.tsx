import { Layers3 } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="Understack home">
      <span className="brand-symbol">
        <Layers3 size={24} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span>
          understack<span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
