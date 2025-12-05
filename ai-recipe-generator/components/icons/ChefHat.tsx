
import React from 'react';

export const ChefHat: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Sparkle accent */}
    <path d="M19 5L20 7L22 8L20 9L19 11L18 9L16 8L18 7L19 5Z" fill="currentColor" stroke="none" />
    
    {/* Bold Chef Hat */}
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 9.08 0A6 6 0 0 1 18 14" />
    <path d="M17 17H7" />
    <path d="M17 14h.01" />
    <path d="M16 20H8a2 2 0 0 1-2-2v-1h12v1a2 2 0 0 1-2 2Z" />
  </svg>
);
