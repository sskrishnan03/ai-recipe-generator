
import React from 'react';

interface TagProps {
  icon: React.ReactNode;
  text: string;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ icon, text, className = 'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${className}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

export default Tag;