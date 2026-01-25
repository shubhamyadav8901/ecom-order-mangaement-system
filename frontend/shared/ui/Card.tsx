import React from 'react';
import clsx from 'clsx';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('shared-card', className)} {...props}>
      {children}
    </div>
  );
};
