export default function Ship() {
  return (
    <svg viewBox="0 0 320 320" className="ship-svg" aria-hidden="true">
      <defs>
        <linearGradient id="shipBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6fbff" />
          <stop offset="20%" stopColor="#b7d9ef" />
          <stop offset="55%" stopColor="#4c78aa" />
          <stop offset="100%" stopColor="#0b1120" />
        </linearGradient>

        <linearGradient id="shipWing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#101d31" />
          <stop offset="55%" stopColor="#204d88" />
          <stop offset="100%" stopColor="#4ea7ff" />
        </linearGradient>

        <radialGradient id="shipCore" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#dff3ff" />
          <stop offset="100%" stopColor="#4ea7ff" />
        </radialGradient>
      </defs>

      <circle cx="160" cy="160" r="112" className="halo" />
      <circle cx="160" cy="160" r="84" className="halo halo-2" />

      <path
        d="M160 18L197 76L229 110L214 184L160 235L106 184L91 110L123 76Z"
        fill="url(#shipBody)"
        stroke="#eaf7ff"
        strokeWidth="2.1"
      />

      <path d="M160 32L179 84L160 116L141 84Z" fill="#f9fdff" />
      <path d="M160 44L172 84L160 100L148 84Z" fill="#09111d" opacity=".95" />

      <circle cx="160" cy="112" r="16" fill="url(#shipCore)" />
      <circle cx="160" cy="112" r="7" fill="#0a0f18" />
      <circle cx="116" cy="116" r="3.5" fill="#f5fbff" />
      <circle cx="204" cy="116" r="3.5" fill="#f5fbff" />

      <path d="M112 103L36 128L80 146L124 122Z" fill="url(#shipWing)" />
      <path d="M208 103L284 128L240 146L196 122Z" fill="url(#shipWing)" />

      <path d="M108 160L76 206L114 190Z" fill="#18293f" />
      <path d="M212 160L244 206L206 190Z" fill="#18293f" />

      <path d="M128 176L109 232L137 215Z" fill="#0d1624" />
      <path d="M192 176L211 232L183 215Z" fill="#0d1624" />

      <ellipse cx="160" cy="192" rx="42" ry="14" fill="#4ea7ff" opacity=".16" />

      <path
        d="M126 193C109 216 120 239 137 232C145 229 146 214 140 202Z"
        fill="#dff3ff"
        opacity=".88"
      />
      <path
        d="M194 193C211 216 200 239 183 232C175 229 174 214 180 202Z"
        fill="#dff3ff"
        opacity=".88"
      />
    </svg>
  );
}
