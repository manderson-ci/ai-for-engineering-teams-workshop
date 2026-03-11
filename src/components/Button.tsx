import React from 'react';

export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonProps['variant'], string> = {
  primary:
    'bg-blue-600 text-white border border-transparent hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
  danger:
    'bg-red-600 text-white border border-transparent hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
};

export const Button = React.memo(function Button({
  label,
  onClick,
  variant,
  isLoading = false,
  disabled = false,
  ariaLabel,
  type = 'button',
}: ButtonProps) {
  const isInactive = isLoading || disabled;

  return (
    <button
      type={type}
      onClick={isInactive ? undefined : onClick}
      disabled={isInactive}
      aria-label={ariaLabel}
      aria-disabled={isInactive ? 'true' : undefined}
      aria-busy={isLoading ? 'true' : undefined}
      className={[
        'inline-flex items-center justify-center gap-2',
        'max-w-[200px] w-full min-h-[44px]',
        'rounded-md px-4 py-2 text-sm font-medium',
        'transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variantStyles[variant],
        isInactive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ]
        .join(' ')
        .trim()}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      ) : (
        label
      )}
    </button>
  );
});
