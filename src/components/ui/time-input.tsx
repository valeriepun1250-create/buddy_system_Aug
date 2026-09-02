'use client';

import {
  forwardRef,
  useEffect,
  useState,
  type ComponentProps,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Zap, X } from 'lucide-react';

type Period = 'AM' | 'PM';

interface TimeInputProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: ComponentProps<'button'>['aria-invalid'];
  allowNotApplicable?: boolean;
  onSetNow?: () => void;
  onClear?: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0')
);

const parseTime = (value?: string) => {
  if (value === 'NA') {
    return { hour: '', minute: '', period: 'PM' as Period, isNotApplicable: true };
  }

  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return { hour: '', minute: '', period: 'PM' as Period, isNotApplicable: false };
  }

  const [hour24, minute] = value.split(':').map(Number);
  if (hour24 > 23 || minute > 59) {
    return { hour: '', minute: '', period: 'PM' as Period, isNotApplicable: false };
  }

  return {
    hour: String(hour24 % 12 || 12),
    minute: String(minute).padStart(2, '0'),
    period: (hour24 >= 12 ? 'PM' : 'AM') as Period,
    isNotApplicable: false,
  };
};

const to24HourTime = (hour: string, minute: string, period: Period) => {
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  if (
    !hour ||
    !minute ||
    hourNumber < 1 ||
    hourNumber > 12 ||
    minuteNumber < 0 ||
    minuteNumber > 59
  ) {
    return null;
  }

  const hour24 = (hourNumber % 12) + (period === 'PM' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${String(minuteNumber).padStart(2, '0')}`;
};

const TimeInput = forwardRef<HTMLButtonElement, TimeInputProps>(
  (
    {
      className,
      value,
      onChange,
      onSetNow,
      onClear,
      allowNotApplicable = false,
      disabled,
      id,
      onBlur,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
    },
    ref
  ) => {
    const parsedValue = parseTime(value);
    const [hour, setHour] = useState(parsedValue.hour);
    const [minute, setMinute] = useState(parsedValue.minute);
    const [period, setPeriod] = useState<Period>(parsedValue.period);
    const [isNotApplicable, setIsNotApplicable] = useState(
      parsedValue.isNotApplicable
    );

    useEffect(() => {
      const next = parseTime(value);
      setHour(next.hour);
      setMinute(next.minute);
      setPeriod(next.period);
      setIsNotApplicable(next.isNotApplicable);
    }, [value]);

    const commitTime = (
      nextHour: string,
      nextMinute: string,
      nextPeriod: Period
    ) => {
      const nextValue = to24HourTime(nextHour, nextMinute, nextPeriod);
      if (nextValue) onChange?.(nextValue);
    };

    const handleHourChange = (nextHour: string) => {
      const nextMinute = nextHour && !minute ? '00' : minute;
      setIsNotApplicable(false);
      setHour(nextHour);
      setMinute(nextMinute);
      commitTime(nextHour, nextMinute, period);
    };

    const handleMinuteChange = (nextMinute: string) => {
      setMinute(nextMinute);
      commitTime(hour, nextMinute, period);
    };

    const handlePeriodChange = (nextPeriod: Period) => {
      setPeriod(nextPeriod);
      commitTime(hour, minute, nextPeriod);
    };

    const handleNotApplicableChange = () => {
      if (isNotApplicable) {
        setIsNotApplicable(false);
        onChange?.('');
        return;
      }

      setHour('');
      setMinute('');
      setPeriod('PM');
      setIsNotApplicable(true);
      onChange?.('NA');
    };

    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <div
          className={cn(
            'flex h-10 flex-none items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            allowNotApplicable ? 'min-w-[15rem]' : 'min-w-[12.5rem]'
          )}
          role="group"
          aria-label="Time in 12-hour format"
        >
          <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
            <SelectTrigger
              ref={ref}
              id={id}
              onBlur={onBlur}
              aria-label="Hour"
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className="h-full w-14 shrink-0 rounded-none border-0 px-2 text-center shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:flex-1"
            >
              <SelectValue placeholder="hh" />
            </SelectTrigger>
            <SelectContent position="item-aligned" className="max-h-60 min-w-14">
              {HOURS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="font-semibold" aria-hidden="true">:</span>
          <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled || isNotApplicable}>
            <SelectTrigger
              onBlur={onBlur}
              aria-label="Minute"
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className="h-full w-14 shrink-0 rounded-none border-0 px-2 text-center shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:flex-1"
            >
              <SelectValue placeholder="mm" />
            </SelectTrigger>
            <SelectContent position="item-aligned" className="max-h-60 min-w-14">
              {MINUTES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex h-full shrink-0 border-l border-input p-1">
            {(['AM', 'PM'] as const).map((option) => (
              <button
                key={option}
                type="button"
                disabled={disabled || isNotApplicable}
                aria-pressed={!isNotApplicable && period === option}
                onClick={() => handlePeriodChange(option)}
                className={cn(
                  'min-w-10 px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !isNotApplicable && period === option
                    ? 'rounded-sm bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option}
              </button>
            ))}
            {allowNotApplicable && (
              <button
                type="button"
                disabled={disabled}
                aria-pressed={isNotApplicable}
                onClick={handleNotApplicableChange}
                className={cn(
                  'min-w-10 px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isNotApplicable
                    ? 'rounded-sm bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                N/A
              </button>
            )}
          </div>
        </div>
        {onSetNow && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSetNow}
            disabled={disabled}
            className="flex shrink-0 items-center gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-bold uppercase tracking-wider">Set Now</span>
          </Button>
        )}
        {onClear && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClear}
            disabled={disabled}
            className="h-10 w-10 shrink-0 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Clear time"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);
TimeInput.displayName = 'TimeInput';

export { TimeInput };
