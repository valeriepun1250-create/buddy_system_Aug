'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/components/providers/app-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Case } from '@/lib/types';
import { CircleCheck, CircleHelp, Hourglass, MoreHorizontal, Trash2, Edit, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface CaseListProps {
    cases: Case[];
    onCaseSelect: (caseData: Case) => void;
    onCaseCopy: (caseData: Case) => void;
}

const PAGE_SIZE = 15;

const toCreatedAtDate = (date: Case['createdAt']) => {
  return date instanceof Timestamp ? date.toDate() : new Date(date);
};

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'warning' | 'success', icon: React.ReactNode, color: string } } = {
  'To be completed by clerk': { text: 'To be completed by clerk', variant: 'warning', icon: <Hourglass className="h-4 w-4" />, color: "bg-yellow-400" },
  'To be follow up by clerk/buddy OT': { text: 'To be follow up by clerk/buddy OT', variant: 'warning', icon: <CircleHelp className="h-4 w-4" />, color: "bg-orange-300" },
  'Complete': { text: 'Complete', variant: 'success', icon: <CircleCheck className="h-4 w-4" />, color: "bg-green-500" },
};


export function CaseList({ cases, onCaseSelect, onCaseCopy }: CaseListProps) {
  const { findUserByName, deleteCase } = useAppContext();
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when the cases list changes (e.g. tab switch)
  useEffect(() => {
    setCurrentPage(1);
  }, [cases]);

  const handleDelete = async () => {
    if (caseToDelete) {
        await deleteCase(caseToDelete.id);
        toast({
            title: "Case Deleted",
            description: `Case for patient ${Array.isArray(caseToDelete.patientOPD) ? caseToDelete.patientOPD.join(', ') : caseToDelete.patientOPD} has been deleted.`,
        });
        setCaseToDelete(null);
    }
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
        <div className="mb-4 text-muted-foreground/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
        </div>
        <h3 className="text-xl font-semibold tracking-tight">No Cases Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          There are no cases to display in this view.
        </p>
      </div>
    );
  }

  // Pagination calculations
  const totalPages = Math.ceil(cases.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedCases = cases.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Patient OPD</TableHead>
                <TableHead>Therapists</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCases.map((caseItem) => {
                const statusInfo = statusMap[caseItem.status] || { 
                  text: caseItem.status || 'Unknown', 
                  variant: 'outline' as const, 
                  icon: <CircleHelp className="h-4 w-4" />,
                  color: 'bg-muted' 
                };
                const openingTherapist = findUserByName(caseItem.openingTherapistId);
                const buddyTherapist = findUserByName(caseItem.buddyTherapistId);
                const createdAt = toCreatedAtDate(caseItem.createdAt);
                
                return (
                  <TableRow
                    key={caseItem.id}
                    className="group"
                  >
                    <TableCell onClick={() => onCaseSelect(caseItem)} className="cursor-pointer">
                      <div className={cn(badgeVariants({ variant: statusInfo.variant || 'outline' }), "flex items-center gap-2 whitespace-nowrap", statusInfo.color === 'bg-orange-300' ? 'bg-orange-300 text-black' : '', statusInfo.color === 'bg-yellow-400' ? 'bg-yellow-400 text-black' : '', statusInfo.variant === 'success' ? 'bg-green-500 text-white' : '')}>
                         <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                        <span>{statusInfo.text}</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => onCaseSelect(caseItem)} className="cursor-pointer">
                      <Badge variant="outline">{caseItem.caseType}</Badge>
                    </TableCell>
                    <TableCell onClick={() => onCaseSelect(caseItem)} className="font-medium cursor-pointer">
                      {Array.isArray(caseItem.patientOPD) ? caseItem.patientOPD.join(', ') : caseItem.patientOPD}
                    </TableCell>
                    <TableCell onClick={() => onCaseSelect(caseItem)} className="cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">{openingTherapist?.name ?? 'N/A'}</span>
                        <span className="text-sm text-muted-foreground">{buddyTherapist?.name ?? 'N/A'} (Buddy)</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => onCaseSelect(caseItem)} className="hidden md:table-cell cursor-pointer">
                      {format(createdAt, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => onCaseSelect(caseItem)}>
                                <Edit className="mr-2 h-4 w-4" />
                                View/Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onCaseCopy(caseItem)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setCaseToDelete(caseItem)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={!!caseToDelete} onOpenChange={(open) => !open && setCaseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the case for patient <span className="font-bold">{caseToDelete && (Array.isArray(caseToDelete.patientOPD) ? caseToDelete.patientOPD.join(', ') : caseToDelete.patientOPD)}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({variant: 'destructive'})}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
