"use client";

import { PARISHES, type Parish } from "@/lib/types";

export function ParishSelect({
  id,
  label,
  value,
  onChange,
  required = true,
}: {
  id: string;
  label: string;
  value: Parish | "";
  onChange: (value: Parish) => void;
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
        onChange={(e) => onChange(e.target.value as Parish)}
        className="w-full rounded-full border border-border-strong bg-paper px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-tide"
      >
        <option value="" disabled>
          Select a parish
        </option>
        {PARISHES.map((parish) => (
          <option key={parish} value={parish}>
            {parish}
          </option>
        ))}
      </select>
    </div>
  );
}
