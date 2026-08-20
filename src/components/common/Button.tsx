import { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
};

function Button({ variant = 'primary', fullWidth = false, className = '', ...props }: ButtonProps) {
  const classes = ['button', `button--${variant}`];

  if (fullWidth) {
    classes.push('button--full');
  }

  if (className) {
    classes.push(className);
  }

  return <button className={classes.join(' ')} {...props} />;
}

export default Button;
