import { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({ className = '', ...props }: InputProps) {
  return <input className={`input ${className}`} {...props} />;
}

export default Input;
