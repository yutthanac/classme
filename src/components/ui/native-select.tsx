import React, { useId } from 'react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  /** Optional shorthand; children <option>s are still supported. */
  options?: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  wrapperClassName?: string;
}

/**
 * Native <select> styled through `.ui-select` (globals.css).
 * Uses `appearance: base-select` where supported (Chromium 135+),
 * falls back to a styled native control elsewhere.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, size = 'md', className, wrapperClassName, id, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;

  const control = (
    <select
      ref={ref}
      id={selectId}
      className={cn('ui-select', size === 'sm' ? 'ui-select-sm' : 'ui-select-md', className)}
      {...props}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options?.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
      {children}
    </select>
  );

  if (!label) return control;

  return (
    <div className={cn('flex flex-col gap-1', wrapperClassName)}>
      <label htmlFor={selectId} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      {control}
    </div>
  );
});

export { Select as NativeSelect };
export default Select;
