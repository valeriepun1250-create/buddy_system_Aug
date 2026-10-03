'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/components/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseList } from './case-list';
import { FilePlus2, Search, X } from 'lucide-react';
import { NewCaseDialog } from './new-case-dialog';
import { CaseDetailsDialog } from './case-details-dialog';
import type { Case } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { SelectCaseTypeDialog } from './select-case-type-dialog';
import { format, isSameDay } from 'date-fns';

const toVisitDateMillis = (caseData: Case) => {
  const date = caseData.visitDate || caseData.createdAt;
  return date instanceof Timestamp ? date.toMillis() : new Date(date).getTime();
};

const toVisitDate = (caseData: Case) => {
  const date = caseData.visitDate || caseData.createdAt;
  return date instanceof Timestamp ? date.toDate() : new Date(date);
};

const normalizeSearchText = (value: unknown) => String(value ?? '').toLowerCase().trim();

const getCaseSearchText = (caseData: Case) => {
  const visitDate = toVisitDate(caseData);
  const visitDateText = Number.isNaN(visitDate.getTime()) ? '' : format(visitDate, 'dd/MM/yyyy yyyy-MM-dd');
  const patientOPD = Array.isArray(caseData.patientOPD) ? caseData.patientOPD.join(' ') : caseData.patientOPD;
  const patientPhone = Array.isArray(caseData.patientPhone) ? caseData.patientPhone.join(' ') : caseData.patientPhone;
  const oahNames = [
    ...(caseData.oahNames || []),
    ...(caseData.cgatVisitUnits || []).map(unit => unit.oahName),
  ].join(' ');

  return [
    caseData.caseType,
    caseData.status,
    patientOPD,
    patientPhone,
    caseData.homeVisitDistrict,
    caseData.openingTherapistId,
    caseData.buddyTherapistId,
    caseData.responsibleClerkId,
    oahNames,
    visitDateText,
  ].map(normalizeSearchText).join(' ');
};

export function CaseDashboard() {
  const { userProfile, cases } = useAppContext();
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseToCopy, setCaseToCopy] = useState<Case | null>(null);
  const [isSelectCaseTypeOpen, setIsSelectCaseTypeOpen] = useState(false);
  const [newCaseType, setNewCaseType] = useState<'COT' | 'CGAT' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setToday((current) => {
        const now = new Date();
        return isSameDay(current, now) ? current : now;
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

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
          (c.status === 'To be completed by clerk' || c.status === 'To be follow up by clerk/buddy OT') &&
          !!c.visitDate &&
          isSameDay(toVisitDate(c), today)
      );
    }
    return [];
  }, [userProfile, cases, today]);

  const allCases = useMemo(() => {
    return [...cases].sort((a, b) => {
        const dateA = toVisitDateMillis(a);
        const dateB = toVisitDateMillis(b);
        return dateB - dateA;
    });
  }, [cases]);

  const filteredMyCases = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return myCases;
    return myCases.filter(caseData => getCaseSearchText(caseData).includes(query));
  }, [myCases, searchQuery]);

  const filteredAllCases = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return allCases;
    return allCases.filter(caseData => getCaseSearchText(caseData).includes(query));
  }, [allCases, searchQuery]);

  const cotCases = useMemo(() => filteredAllCases.filter(c => c.caseType === 'COT'), [filteredAllCases]);
  const cgatCases = useMemo(() => filteredAllCases.filter(c => c.caseType === 'CGAT'), [filteredAllCases]);

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
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search cases"
                className="h-10 pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {userProfile.role === 'Case Therapist' && (
              <Button onClick={() => setIsSelectCaseTypeOpen(true)} className="w-full sm:w-auto">
                <FilePlus2 className="mr-2 h-4 w-4" />
                New Case
              </Button>
            )}
          </div>
        </div>
        <TabsContent value="my-cases">
          <CaseList cases={filteredMyCases} onCaseSelect={(c) => setSelectedCaseId(c.id)} onCaseCopy={handleCopyCase} />
        </TabsContent>
        <TabsContent value="all-cases">
          <CaseList cases={filteredAllCases} onCaseSelect={(c) => setSelectedCaseId(c.id)} onCaseCopy={handleCopyCase} />
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
