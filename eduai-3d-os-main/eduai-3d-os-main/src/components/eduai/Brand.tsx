import { Link } from "@tanstack/react-router";

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.3em]">
      <span className="h-2 w-2 rotate-45 bg-primary glow" /> EDUAI
    </Link>
  );
}
