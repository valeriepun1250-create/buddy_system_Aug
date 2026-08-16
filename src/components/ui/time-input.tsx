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
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            )}
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
