'use client';

import { forwardRef, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Zap, X } from "lucide-react";

interface TimeInputProps extends Omit<ComponentProps<"input">, 'type'> {
  onSetNow?: () => void;
  onClear?: () => void;
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, onSetNow, onClear, ...props }, ref) => {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative flex-1">
          <Input
            type="time"
            ref={ref} 
            {...props}
            step={60}
            className="min-w-0 [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-date-and-time-value]:text-left"
          />
        </div>
        {onSetNow && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSetNow}
            disabled={props.disabled}
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
            disabled={props.disabled}
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
