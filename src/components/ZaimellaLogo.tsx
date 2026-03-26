export default function ZaimellaLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 130 42"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Zaimella"
    >
      {/* "zai" en verde */}
      <text
        x="2"
        y="28"
        fill="#2db135"
        fontWeight="800"
        fontSize="26"
        fontFamily="Arial Rounded MT Bold, Arial, Helvetica, sans-serif"
        letterSpacing="-0.5"
      >
        zai
      </text>
      {/* "mella" en rojo */}
      <text
        x="44"
        y="28"
        fill="#e31e24"
        fontWeight="800"
        fontSize="26"
        fontFamily="Arial Rounded MT Bold, Arial, Helvetica, sans-serif"
        letterSpacing="-0.5"
      >
        mella
      </text>
      {/* Swoosh curvo verde */}
      <path
        d="M4 35 Q30 42 65 38 Q95 34 126 37"
        stroke="#2db135"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
