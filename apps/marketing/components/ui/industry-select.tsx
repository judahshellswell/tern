"use client";

import { INDUSTRIES, type Industry } from "@/lib/types";

export function IndustrySelect({
  id,
  label,
  value,
  onChange,
  required = true,
}: {
  id: string;
  label: string;
  value: Industry | "";
  onChange: (value: Industry) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-granite">
        {label}
      </label>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value as Industry)}
        className="w-full rounded-full border border-border-strong bg-paper px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-tide"
      >
        <option value="" disabled>
          Select an industry
        </option>
        {INDUSTRIES.map((industry) => (
          <option key={industry} value={industry}>
            {industry}
          </option>
        ))}
      </select>
    </div>
  );
}
