"use client";

import * as React from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, className, id }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          h-4 w-4 shrink-0 rounded-sm border border-gray-300 cursor-pointer
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
          ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className || ''}
        `}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        {checked && (
          <div className="flex items-center justify-center w-full h-full">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </div>
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };