import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div style={{ width: '100%' }}>
      {label && <label htmlFor={inputId} style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500}}>{label}</label>}
      <input
        id={inputId}
        className={clsx('shared-input', className)}
        style={error ? {borderColor: '#ef4444'} : {}}
        {...props}
      />
      {error && <p style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem'}}>{error}</p>}
    </div>
  );
};
