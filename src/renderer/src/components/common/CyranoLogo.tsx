import React from 'react';

interface CyranoLogoProps {
  size?: number;
  className?: string;
  showBorder?: boolean;
}

/**
 * Cyrano Brand Logo — "Cyber Plume & Wave" (Variant 02)
 * Stylized high-contrast geometric white & electric-blue Cyrano feather plume
 * formed from four aerodynamic script/audio-wave blades on a deep obsidian squircle.
 */
export const CyranoLogo: React.FC<CyranoLogoProps> = ({
  size = 32,
  className = '',
  showBorder = true
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Cyrano Logo"
    >
      {/* Squircle Base Plate */}
      <rect
        x="4"
        y="4"
        width="232"
        height="232"
        rx="54"
        fill="#060A17"
        stroke={showBorder ? '#25324B' : 'transparent'}
        strokeWidth="4"
      />

      {/* Subtle inner rim highlight */}
      <rect
        x="8"
        y="8"
        width="224"
        height="224"
        rx="50"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.06"
        strokeWidth="2"
      />

      {/* Optically centered & scaled Cyber Plume & Wave mark */}
      <g transform="translate(120, 120) scale(1.12) translate(-128.34, -120)">
        {/* Blade 1 (Top — Electric Royal Blue) */}
        <path
          transform="translate(79.96, 41.2)"
          d="M102.16 0c-18.16 11.04-36 17.08-51.8 23.12-16.48 6.36-42.84 18.64-50.36 55.36 16.92-20.44 33.72-28.96 49.44-36.08 16.68-7.64 32.16-15.44 52.72-42.4z"
          fill="#2F7BFD"
        />

        {/* Blade 2 (Upper Middle — Pure White) */}
        <path
          transform="translate(84.48, 72.2)"
          d="M86.76 0c-15.72 8.52-30.92 13.08-43.16 18.08-17.56 7.08-37.92 22.08-43.6 47.76 12.56-15.72 22.84-21.36 34.56-26.32 17.6-7.36 34.6-15.32 52.2-39.52z"
          fill="#FFFFFF"
        />

        {/* Blade 3 (Lower Middle — Bright Cyan) */}
        <path
          transform="translate(86.72, 100.16)"
          d="M77.6 0c-15 7.6-30.68 12-42.96 16.88-16.12 6.36-30.4 16.2-34.64 40.28 10.16-13.68 20.88-18.24 32.28-23.16 14.92-6.4 30.24-14.24 45.32-34z"
          fill="#36C5FD"
        />

        {/* Blade 4 (Bottom Quill Stem — Pure White) */}
        <path
          transform="translate(74.56, 127.28)"
          d="M82.04 0c-14.04 6.12-28.08 9.44-39.36 14.04-10.4 4.16-19.6 9.48-25.08 19.04l-10.32 18.32-7.28 20.04 12.96-17.52 6.12-12.72c3.64-5 9.4-7.4 15.08-9.52 15.88-6.08 32.04-12.12 47.88-31.68z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
};
