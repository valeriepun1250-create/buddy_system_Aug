'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SelectCaseTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (caseType: 'COT' | 'CGAT') => void;
}

export function SelectCaseTypeDialog({ open, onOpenChange, onSelect }: SelectCaseTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Case</DialogTitle>
          <DialogDescription>
            Please select the type of home visit you would like to create.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-around gap-4 pt-4">
          <Button onClick={() => onSelect('COT')} size="lg" className="flex-1">
            COT Home Visit
          </Button>
          <Button onClick={() => onSelect('CGAT')} size="lg" className="flex-1">
            CGAT Home Visit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
