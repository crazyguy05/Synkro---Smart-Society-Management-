"use client";
import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
};

export default function Input({ label, hint, error, leftIcon, className = '', id, ...rest }: Props) {
  const inputId = id || rest.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          className={`input ${leftIcon ? 'pl-10' : ''} ${className} ${error ? 'border-rose-500/50 focus:ring-rose-400/50' : ''}`}
        />
      </div>
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
