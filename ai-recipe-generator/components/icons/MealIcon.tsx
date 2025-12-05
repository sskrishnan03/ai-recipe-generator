
import React from 'react';

interface MealIconProps extends React.SVGProps<SVGSVGElement> {
  type: string;
}

export const MealIcon: React.FC<MealIconProps> = ({ type, ...props }) => {
  const normalizedType = type?.toLowerCase() || '';

  // Breakfast - Coffee/Tea Cup
  if (normalizedType.includes('breakfast') || normalizedType.includes('morning')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    );
  }

  // Dessert - Cupcake
  if (normalizedType.includes('dessert') || normalizedType.includes('sweet') || normalizedType.includes('snack')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
        <path d="M2 21h20" />
        <path d="M7 8v2" />
        <path d="M12 8v2" />
        <path d="M17 8v2" />
        <path d="M7 4h.01" />
        <path d="M12 4h.01" />
        <path d="M17 4h.01" />
      </svg>
    );
  }

  // Lunch - Burger
  if (normalizedType.includes('lunch') || normalizedType.includes('burger') || normalizedType.includes('sandwich')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="4" y="15" width="16" height="4" rx="2" />
        <path d="M4 11h16" />
        <path d="M6.17 7a6 6 0 0 1 11.65 0" />
        <line x1="12" y1="19" x2="12" y2="21" />
      </svg>
    );
  }
  
  // Appetizer - Pizza / Slice
  if (normalizedType.includes('appetizer') || normalizedType.includes('starter')) {
    return (
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M15 11h.01" />
        <path d="M11 15h.01" />
        <path d="M16 16h.01" />
        <path d="m2 2 20 20" />
        <path d="M13.4 8.4a8 8 0 1 0-5 5" />
        <path d="M14.8 14.8 19 19" />
        <path d="M5 5 9.2 9.2" />
      </svg>
    );
  }

  // Dinner/Generic - Covered Dish (Cloche)
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 2h4" />
      <path d="M12 2v2" />
      <path d="M5.1 7c-.5 2.7.2 4.9 1.9 6h10c1.7-1.1 2.4-3.3 1.9-6a9 9 0 0 0-13.8 0Z" />
      <path d="M2 17h20" />
      <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    </svg>
  );
};
