
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

const Select: React.FC<SelectProps> = ({ label, name, value, onChange, options }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full neu-input rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all appearance-none cursor-pointer"
        >
            {options.map(option => (
            <option key={option} value={option} className="bg-white text-slate-800">
                {option}
            </option>
            ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default Select;
