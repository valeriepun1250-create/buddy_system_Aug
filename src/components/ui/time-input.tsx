'use client';

import { forwardRef, type ChangeEvent, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock3, Zap, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeInputProps extends Omit<ComponentProps<"input">, 'type'> {
  onSetNow?: () => void;
  onClear?: () => void;
}

const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, onSetNow, onClear, value, onChange, onBlur, name, disabled, ...props }, ref) => {
    const timeValue = typeof value === 'string' ? value : '';
    const [selectedHour = '', selectedMinute = ''] = timeValue.split(':');

    const updateTime = (hour: string, minute: string) => {
      const nextValue = hour ? `${hour}:${minute || '00'}` : '';
      const event = {
        target: { name, value: nextValue },
        currentTarget: { name, value: nextValue },
      } as ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };

    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <input
            type="hidden"
            ref={ref} 
            name={name}
            value={timeValue}
            onChange={onChange}
            onBlur={onBlur}
            {...props}
        />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Select
            value={selectedHour}
            onValueChange={(hour) => updateTime(hour, selectedMinute)}
            disabled={disabled}
          >
            <SelectTrigger className="min-w-[4.75rem] flex-1">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedMinute}
            onValueChange={(minute) => updateTime(selectedHour || '00', minute)}
            disabled={disabled}
          >
            <SelectTrigger className="min-w-[4.75rem] flex-1">
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onSetNow && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSetNow}
            disabled={disabled}
            className="shrink-0 flex items-center gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
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
            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 border-destructive/20 h-10 w-10"
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
