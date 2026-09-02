'use client';

import { forwardRef, useState, type ComponentProps } from 'react';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: ComponentProps<'button'>['aria-invalid'];
}

const parseDateValue = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
};

const DateInput = forwardRef<HTMLButtonElement, DateInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      disabled,
      id,
      className,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const selectedDate = parseDateValue(value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            onBlur={onBlur}
            aria-label="Choose date"
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-expanded={open}
            className={cn(
              'w-full justify-between text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              className
            )}
          >
            <span>{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'DD/MM/YYYY'}</span>
            <CalendarDays className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange?.(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DateInput.displayName = 'DateInput';

export { DateInput };
