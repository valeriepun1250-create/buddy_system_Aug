'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/components/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseList } from './case-list';
import { FilePlus2 } from 'lucide-react';
import { NewCaseDialog } from './new-case-dialog';
import { CaseDetailsDialog } from './case-details-dialog';
import type { Case } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { SelectCaseTypeDialog } from './select-case-type-dialog';

const toCreatedAtMillis = (date: Case['createdAt']) => {
  return date instanceof Timestamp ? date.toMillis() : new Date(date).getTime();
};

export function CaseDashboard() {
  const { userProfile, cases } = useAppContext();
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseToCopy, setCaseToCopy] = useState<Case | null>(null);
  const [isSelectCaseTypeOpen, setIsSelectCaseTypeOpen] = useState(false);
  const [newCaseType, setNewCaseType] = useState<'COT' | 'CGAT' | null>(null);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return cases.find(c => c.id === selectedCaseId) || null;
  }, [selectedCaseId, cases]);

  const myCases = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'Case Therapist') {
      return cases.filter(
        (c) =>
          (c.openingTherapistId === userProfile.name || c.buddyTherapistId === userProfile.name) &&
          c.status !== 'Complete'
      );
    }
    if (userProfile.role === 'Clerk') {
      return cases.filter(
        (c) =>
          (c.status === 'To be completed by clerk' || c.status === 'To be follow up by clerk/buddy OT')
      );
    }
    return [];
  }, [userProfile, cases]);

  const allCases = useMemo(() => {
    return [...cases].sort((a, b) => {
        const dateA = toCreatedAtMillis(a.createdAt);
        const dateB = toCreatedAtMillis(b.createdAt);
        return dateB - dateA;
    });
  }, [cases]);

  const cotCases = useMemo(() => allCases.filter(c => c.caseType === 'COT'), [allCases]);
  const cgatCases = useMemo(() => allCases.filter(c => c.caseType === 'CGAT'), [allCases]);

  if (!userProfile) return null;
  
  const handleCaseTypeSelect = (caseType: 'COT' | 'CGAT') => {
    setNewCaseType(caseType);
    setIsSelectCaseTypeOpen(false);
    setIsNewCaseOpen(true);
  };

  const handleCopyCase = (caseToCopy: Case) => {
    setCaseToCopy(caseToCopy);
    setNewCaseType(caseToCopy.caseType);
    setIsNewCaseOpen(true);
  };

  const handleNewCaseDialogChange = (isOpen: boolean) => {
    setIsNewCaseOpen(isOpen);
    if (!isOpen) {
      setCaseToCopy(null);
      setNewCaseType(null);
    }
  };

  return (
    <>
      <Tabs defaultValue="my-cases">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="my-cases">My Cases</TabsTrigger>
              <TabsTrigger value="all-cases">All Cases</TabsTrigger>
              <TabsTrigger value="cot-cases">COT Cases</TabsTrigger>
              <TabsTrigger value="cgat-cases">CGAT Cases</TabsTrigger>
            </TabsList>
          {userProfile.role === 'Case Therapist' && (
            <Button onClick={() => setIsSelectCaseTypeOpen(true)}>
              <FilePlus2 className="mr-2 h-4 w-4" />
              New Case
            </Button>
          )}
        </div>
        <TabsContent value="my-cases">
          <CaseList cases={myCases} onCaseSelect={(c) => setSelectedCaseId(c.id)} onCaseCopy={handleCopyCase} />
        </TabsContent>
        <TabsContent value="all-cases">
          <CaseList cases={allCases} onCaseSelect={(c) => setSelectedCaseId(c.id)} onCaseCopy={handleCopyCase} />
        </TabsContent>
        <TabsContent value="cot-cases">
          <CaseList cases={cotCases} onCaseSelect={(c) => setSelectedCaseId(c.id)} onCaseCopy={handleCopyCase} />
        </TabsContent>
        <TabsContent value="cgat-cases">
          <CaseList cases={cgatCases} onCaseSelect={(c) => setSelectedCaseId(c.id)} onCaseCopy={handleCopyCase} />
        </TabsContent>
      </Tabs>
      
      <SelectCaseTypeDialog
        open={isSelectCaseTypeOpen}
        onOpenChange={setIsSelectCaseTypeOpen}
        onSelect={handleCaseTypeSelect}
      />

      <NewCaseDialog
        open={isNewCaseOpen}
        onOpenChange={handleNewCaseDialogChange}
        initialData={caseToCopy}
        caseType={newCaseType}
      />
      
      <CaseDetailsDialog 
        caseData={selectedCase} 
        open={!!selectedCaseId} 
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedCaseId(null);
        }} 
      />
    </>
  );
}
