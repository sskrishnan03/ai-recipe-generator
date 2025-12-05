import React from 'react';
import { CheckCircle } from '../icons/CheckCircle';
import { Info } from '../icons/Info';

interface ToastProps {
  message: string;
  type: 'success' | 'info';
}

const toastConfig = {
  success: {
    icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
    style: 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
  },
  info: {
    icon: <Info className="w-6 h-6 text-sky-500" />,
    style: 'bg-sky-50 dark:bg-sky-900/50 border-sky-500/30 text-sky-800 dark:text-sky-200',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const config = toastConfig[type];

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-xl shadow-lg border animate-slide-in-up-fade-out ${config.style}`}
      role="alert"
    >
      {config.icon}
      <p className="font-medium">{message}</p>
    </div>
  );
};

export default Toast;
