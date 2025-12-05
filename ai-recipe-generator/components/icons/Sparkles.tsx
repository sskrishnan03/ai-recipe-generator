
import React from 'react';

export const Sparkles: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9 1.9 4.8 1.9-4.8 4.8-1.9-4.8-1.9Z" />
    <path d="M22 12h-2" />
    <path d="M20 22v-2" />
    <path d="m19.5 4.5-.7.7" />
    <path d="m4.5 19.5.7.7" />
    <path d="M12 22v-2" />
    <path d="M4 12H2" />
    <path d="M4.5 4.5l.7.7" />
    <path d="m19.5 19.5-.7-.7" />
  </svg>
);
