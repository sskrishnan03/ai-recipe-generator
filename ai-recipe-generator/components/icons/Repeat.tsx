
import React from 'react';

export const Repeat: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 2.1l4 4-4 4" />
    <path d="M3 12.6A9 9 0 0 1 12 3a9 9 0 0 1 9 9" />
    <path d="M7 21.9l-4-4 4-4" />
    <path d="M21 11.4A9 9 0 0 1 12 21a9 9 0 0 1-9-9" />
  </svg>
);