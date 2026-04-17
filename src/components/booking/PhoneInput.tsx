import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const COUNTRY_CODES = [
  { label: 'India', value: '+91' },
  { label: 'USA', value: '+1' },
  { label: 'UK', value: '+44' },
  { label: 'Australia', value: '+61' },
  { label: 'Saudi Arabia', value: '+966' },
  { label: 'UAE', value: '+971' },
];

const PHONE_REGEX = /^\d{5,14}$/;

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, '');
  return PHONE_REGEX.test(digits);
};

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, className, placeholder }) => {
  const defaultCode = COUNTRY_CODES[0].value;
  const currentCode = COUNTRY_CODES.find(cc => value.startsWith(cc.value))?.value || defaultCode;
  const displayValue = value.startsWith(currentCode) ? value.slice(currentCode.length) : value.replace(/\D/g, '');
  const showError = displayValue.length > 0 && !PHONE_REGEX.test(displayValue);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    onChange(`${currentCode}${raw}`);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    onChange(`${newCode}${displayValue}`);
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          value={currentCode}
          onChange={handleCodeChange}
          className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {COUNTRY_CODES.map(code => (
            <option key={code.value} value={code.value}>
              {code.label} ({code.value})
            </option>
          ))}
        </select>
        <Input
          type="tel"
          value={displayValue}
          onChange={handleNumberChange}
          placeholder={placeholder || '9876543210'}
          className={cn(showError && 'border-destructive focus-visible:ring-destructive', className)}
          maxLength={14}
        />
      </div>
      {showError && (
        <p className="text-xs text-destructive">Enter a valid phone number</p>
      )}
    </div>
  );
};

export default PhoneInput;
