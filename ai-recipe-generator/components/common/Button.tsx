
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ isLoading, children, className, ...props }) => {
  const baseClasses = "flex items-center justify-center px-6 py-3 border text-base font-semibold rounded-xl focus:outline-none transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:translate-y-0";
  const defaultClasses = "border-transparent text-slate-800 bg-white/50 hover:bg-white/80 backdrop-blur-sm border-white/40 shadow-sm";
  
  // Allow className prop to override default styles completely if needed, otherwise merge
  const finalClass = className ? `${baseClasses} ${className}` : `${baseClasses} ${defaultClasses}`;

  return (
    <button
      {...props}
      className={`${finalClass} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
