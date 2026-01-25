import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  icon,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx('shared-btn', `shared-btn-${variant}`, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="shared-spinner" />}
      {!isLoading && icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
};
