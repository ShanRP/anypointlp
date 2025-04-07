
import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'black';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  to?: string;
  as?: any;
  fullWidth?: boolean;
  ariaLabel?: string;
};

export const CustomButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  iconPosition = 'right',
  onClick,
  disabled = false,
  type = 'button',
  href,
  to,
  as,
  fullWidth = false,
  ariaLabel,
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow',
    outline: 'bg-transparent border border-purple-300 text-purple-600 hover:bg-purple-50',
    ghost: 'bg-transparent text-gray-700 hover:text-purple-600 hover:bg-gray-50',
    black: 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg',
  };
  
  const sizes = {
    sm: 'text-sm px-3 py-1.5 rounded-full',
    md: 'text-base px-5 py-2.5 rounded-full',
    lg: 'text-lg px-7 py-3 rounded-full',
  };
  
  const buttonClasses = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    className
  );
  
  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2 flex items-center">{icon}</span>}
    </>
  );

  const MotionButton = motion.button;
  const MotionA = motion.a;
  
  const buttonAnimation = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 }
  };
  
  if (as) {
    const Component = as;
    return (
      <motion.div {...buttonAnimation}>
        <Component 
          to={to}
          href={href}
          className={buttonClasses}
          onClick={onClick}
          aria-label={ariaLabel}
        >
          {buttonContent}
        </Component>
      </motion.div>
    );
  }
  
  if (href && !disabled) {
    return (
      <MotionA 
        href={href}
        className={buttonClasses}
        aria-label={ariaLabel}
        onClick={onClick}
        {...buttonAnimation}
      >
        {buttonContent}
      </MotionA>
    );
  }
  
  return (
    <MotionButton
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...buttonAnimation}
    >
      {buttonContent}
    </MotionButton>
  );
};
