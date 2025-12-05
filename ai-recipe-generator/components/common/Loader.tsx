import React from 'react';

interface LoaderProps {
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 border-4 border-t-4 border-t-red-500 border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
};

export default Loader;