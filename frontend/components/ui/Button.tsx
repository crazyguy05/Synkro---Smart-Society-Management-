"use client";
import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
};

const variantCls: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost:   'btn-ghost',
  danger:  'btn-danger',
};

const sizeCls: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  className = '',
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${variantCls[variant]} ${sizeCls[size]} ${className}`}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
