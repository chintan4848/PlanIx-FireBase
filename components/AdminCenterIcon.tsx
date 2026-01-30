import React from 'react';

interface AdminCenterIconProps {
  className?: string;
  size?: number;
}

const AdminCenterIcon: React.FC<AdminCenterIconProps> = ({ className, size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Monitor Frame */}
      <rect x="40" y="60" width="432" height="300" rx="20" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="32" />
      <rect x="60" y="80" width="392" height="260" rx="10" stroke="currentColor" strokeWidth="12" fill="none" />
      
      {/* Monitor Stand */}
      <path d="M216 360 C216 360 196 420 166 420 H346 C316 420 296 360 296 360" fill="currentColor" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" />
      <rect x="166" y="420" width="180" height="32" rx="8" fill="currentColor" />

      {/* Internal Content: Line Chart (Top Left) */}
      <path d="M100 210 L160 170 L200 190 L240 120" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M220 120 H240 V140" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M240 120 L225 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />

      {/* Internal Content: Bar Charts (Middle Left) */}
      <rect x="100" y="240" width="25" height="60" fill="currentColor" />
      <rect x="145" y="220" width="25" height="80" fill="currentColor" />
      <rect x="190" y="200" width="25" height="100" fill="currentColor" />
      
      {/* Bottom Horizontal Lines (Left) */}
      <rect x="100" y="315" width="115" height="8" rx="4" fill="currentColor" fillOpacity="0.5" />
      <rect x="100" y="330" width="80" height="8" rx="4" fill="currentColor" fillOpacity="0.5" />

      {/* Internal Content: Pie Chart (Top Right) */}
      <path d="M350 210 A60 60 0 1 0 350 90 A60 60 0 0 0 350 210 Z" stroke="currentColor" strokeWidth="12" />
      <path d="M350 150 L400 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      <path d="M350 150 V90" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      <path d="M350 150 H410" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />

      {/* Internal Content: Small Bars (Bottom Right) */}
      <rect x="280" y="225" width="8" height="75" fill="currentColor" />
      <rect x="310" y="270" width="8" height="30" fill="currentColor" />
      <rect x="340" y="245" width="8" height="55" fill="currentColor" />
      <rect x="370" y="280" width="8" height="20" fill="currentColor" />
      <rect x="400" y="235" width="8" height="65" fill="currentColor" />
      <rect x="265" y="300" width="160" height="8" rx="4" fill="currentColor" />
    </svg>
  );
};

export default AdminCenterIcon;