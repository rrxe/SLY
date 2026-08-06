import React from 'react';

export const PhantomShipSVG: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width: '100%',
        height: '100%',
        filter: 'drop-shadow(0px 8px 24px rgba(0, 229, 255, 0.45))'
      }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="hullGrad" x1="100" y1="20" x2="100" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="35%" stopColor="#275DFF" />
          <stop offset="100%" stopColor="#0B1020" />
        </linearGradient>

        <linearGradient id="wingGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#101828" />
          <stop offset="100%" stopColor="#05070D" />
        </linearGradient>

        <linearGradient id="engineGlow" x1="100" y1="140" x2="100" y2="195" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#275DFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Engine Plasma Thrusters */}
      <polygon points="92,142 100,192 108,142" fill="url(#engineGlow)" />
      <polygon points="76,134 83,170 90,134" fill="url(#engineGlow)" />
      <polygon points="110,134 117,170 124,134" fill="url(#engineGlow)" />

      {/* Main Wing Wings Structure */}
      <polygon
        points="100,25 178,135 142,145 100,122 58,145 22,135"
        fill="url(#wingGrad)"
        stroke="#275DFF"
        strokeWidth="1.5"
      />

      {/* Outer Armor Panels */}
      <polygon points="178,135 192,118 158,82" fill="#0B1020" stroke="#00E5FF" strokeWidth="1" />
      <polygon points="22,135 8,118 42,82" fill="#0B1020" stroke="#00E5FF" strokeWidth="1" />

      {/* Central Fighter Hull */}
      <polygon
        points="100,18 132,108 100,138 68,108"
        fill="url(#hullGrad)"
        stroke="#00E5FF"
        strokeWidth="1.5"
      />

      {/* Cockpit Canopy */}
      <polygon
        points="100,42 112,82 100,98 88,82"
        fill="#00E5FF"
        fillOpacity="0.25"
        stroke="#00E5FF"
        strokeWidth="1.5"
      />

      {/* HUD Lines & Details */}
      <line x1="100" y1="18" x2="100" y2="138" stroke="#00E5FF" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="68" y1="108" x2="38" y2="128" stroke="#275DFF" strokeWidth="1" />
      <line x1="132" y1="108" x2="162" y2="128" stroke="#275DFF" strokeWidth="1" />

      {/* Front Pulse Emitters */}
      <circle cx="100" cy="22" r="3" fill="#00E5FF" />
      <circle cx="22" cy="135" r="2" fill="#00E5FF" />
      <circle cx="178" cy="135" r="2" fill="#00E5FF" />
    </svg>
  );
};
