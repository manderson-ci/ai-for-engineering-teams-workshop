import React from 'react';
import { Customer } from '@/data/mock-customers';

export interface CustomerCardProps {
  customer: Customer;
  onClick?: (customer: Customer) => void;
}

function getHealthColor(score: number): string {
  if (score <= 30) return 'bg-red-500';
  if (score <= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getHealthLabel(score: number): string {
  if (score <= 30) return 'Poor';
  if (score <= 70) return 'Moderate';
  return 'Good';
}

export const CustomerCard = React.memo(function CustomerCard({
  customer,
  onClick,
}: CustomerCardProps) {
  const { name, company, healthScore, domains } = customer;
  const hasDomains = domains && domains.length > 0;
  const hasMultipleDomains = domains && domains.length > 1;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(customer)}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(customer);
        }
      }}
      className={[
        'w-full max-w-[400px] min-h-[120px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        'dark:border-gray-700 dark:bg-gray-800',
        'flex flex-col gap-2',
        onClick
          ? 'cursor-pointer transition-shadow hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
          : '',
      ]
        .join(' ')
        .trim()}
    >
      {/* Name & health badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</span>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${getHealthColor(healthScore)}`}
        >
          <span>{healthScore}</span>
          <span className="hidden sm:inline">· {getHealthLabel(healthScore)}</span>
        </span>
      </div>

      {/* Company */}
      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{company}</p>

      {/* Domains */}
      {hasDomains && (
        <div className="mt-auto pt-1 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {domains![0]}
            {hasMultipleDomains && (
              <span className="ml-1 text-gray-400 dark:text-gray-500">+{domains!.length - 1} more</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
});
