'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Customer, mockCustomers } from '@/data/mock-customers';
import { CustomerCard } from '@/components/CustomerCard';

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface CustomerSelectorProps {
  /** Called with the selected Customer object when a card is clicked */
  onSelect?: (customer: Customer) => void;
  /** Optionally control the selected customer id from outside */
  selectedCustomerId?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  onSelect,
  selectedCustomerId: controlledSelectedId,
}) => {
  const [query, setQuery] = useState<string>('');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  // Support both controlled (selectedCustomerId prop) and uncontrolled usage.
  const selectedId =
    controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;

  const filteredCustomers = useMemo<Customer[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return mockCustomers;
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed) ||
        c.company.toLowerCase().includes(trimmed),
    );
  }, [query]);

  const handleCardClick = useCallback(
    (customer: Customer) => {
      setInternalSelectedId(customer.id);
      onSelect?.(customer);
    },
    [onSelect],
  );

  return (
    <section
      aria-label="Customer selector"
      className="flex flex-col gap-4 w-full"
    >
      {/* Search input */}
      <div className="w-full">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or company…"
          className={[
            'w-full rounded-lg border border-gray-300 bg-white px-4 py-2',
            'text-sm text-gray-900 placeholder-gray-400',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'transition-colors',
          ].join(' ')}
        />
      </div>

      {/* Customer grid or empty state */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No customers match your search.
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Try a different name or company.
          </p>
        </div>
      ) : (
        <div
          className={[
            'grid gap-4',
            'grid-cols-1',
            'sm:grid-cols-2',
            'lg:grid-cols-3',
          ].join(' ')}
          role="list"
          aria-label="Customer list"
        >
          {filteredCustomers.map((customer) => {
            const isSelected = customer.id === selectedId;
            return (
              <div
                key={customer.id}
                role="listitem"
                className={[
                  'rounded-lg transition-all duration-150',
                  isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                    : 'ring-0',
                ].join(' ')}
              >
                <CustomerCard
                  customer={customer}
                  onClick={handleCardClick}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CustomerSelector;
