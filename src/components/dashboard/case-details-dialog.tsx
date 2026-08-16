'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppContext } from '@/components/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import type { Case, CGATIntervalVisit } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, differenceInHours } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskFactorChecklistDisplay } from './risk-factor-checklist-display';
import { Checkbox } from '@/components/ui/checkbox';
import { TimeInput } from '@/components/ui/time-input';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { Clock, AlertTriangle, Phone, CheckCircle2, History, MapPin, Loader2, Calendar } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CaseDetailsDialogProps {
  caseData: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const followUpSchema = z.object({
  therapistLeavingTime: z.string().min(1, "Time of therapist leaving department is mandatory"),
  caseOtCallBackWithin15MinsOfExpectedArrival: z.boolean(),
  actualArrivalTime: z.string().optional(),
  expectedFinishTime: z.string().optional(),
  caseOtDidNotCallBack: z.boolean(),
  clerkContactTime: z.string().optional(),
  clerkUpdatedExpectedArrivalTimeTime: z.string().optional(),
  caseOtArriveAfterOfficeHour: z.boolean(),
  lossOfContact: z.boolean(),
  reportedTo: z.string().optional(),
  arrivalTimeOutOfOfficeHourNotifiedBuddy: z.boolean(),
}).superRefine((data, ctx) => {
  const hasAction = data.caseOtCallBackWithin15MinsOfExpectedArrival || 
                    data.caseOtDidNotCallBack || 
                    data.arrivalTimeOutOfOfficeHourNotifiedBuddy || 
                    data.lossOfContact;
  
  if (!hasAction) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['therapistLeavingTime'],
      message: 'Please wait for case OT to call back',
    });
  }
});

const closureSchema = z.object({
  caseClosingTime: z.string().optional(),
  actualArrivalTimeOutOfOfficeHour: z.string().optional(),
  didNotCallBack15Mins: z.boolean(),
  buddyContactTime: z.string().optional(),
  updatedExpectedFinishTime: z.string().optional(),
  buddyLossOfContact: z.boolean(),
  buddyReportedTo: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasAction = !!data.caseClosingTime || 
                    !!data.actualArrivalTimeOutOfOfficeHour || 
                    data.didNotCallBack15Mins || 
                    data.buddyLossOfContact;
  
  if (!hasAction) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['caseClosingTime'],
      message: 'Please provide visit completion details',
    });
  }
});

const intervalLogSchema = z.object({
  cgatIntervals: z.array(z.object({
    oahName: z.string(),
    inTime: z.string().optional(),
    outTime: z.string().optional(),
  })),
});

const toDate = (date: Date | string | Timestamp | null | undefined): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(date);
    }
    return date;
}

const formatTime24h = (date: Date | string | Timestamp | null | undefined) => {
    const d = toDate(date);
    if (!d || isNaN(d.getTime())) return null;
    return format(d, "HH:mm");
}

const toTimeInput = (date: Date | string | Timestamp | null | undefined) => {
    const d = toDate(date);
    if (!d || isNaN(d.getTime())) return '';
    return format(d, 'HH:mm');
}

export function CaseDetailsDialog({ caseData: initialCase, open, onOpenChange }: CaseDetailsDialogProps) {
  const { userProfile, updateCase, cases } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const caseData = useMemo(() => {
    if (!initialCase) return null;
    return cases.find(c => c.id === initialCase.id) || initialCase;
  }, [initialCase, cases]);

  const followUpForm = useForm<z.infer<typeof followUpSchema>>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      therapistLeavingTime: '',
      caseOtCallBackWithin15MinsOfExpectedArrival: false,
      actualArrivalTime: '',
      expectedFinishTime: '',
      caseOtDidNotCallBack: false,
      clerkContactTime: '',
      clerkUpdatedExpectedArrivalTimeTime: '',
      caseOtArriveAfterOfficeHour: false,
      lossOfContact: false,
      reportedTo: '',
      arrivalTimeOutOfOfficeHourNotifiedBuddy: false,
    },
  });

  const closureForm = useForm<z.infer<typeof closureSchema>>({
    resolver: zodResolver(closureSchema),
    defaultValues: { 
        caseClosingTime: '',
        actualArrivalTimeOutOfOfficeHour: '',
        didNotCallBack15Mins: false,
        buddyContactTime: '',
        updatedExpectedFinishTime: '',
        buddyLossOfContact: false,
        buddyReportedTo: '',
    },
  });

  const intervalLogForm = useForm<z.infer<typeof intervalLogSchema>>({
    resolver: zodResolver(intervalLogSchema),
    defaultValues: {
      cgatIntervals: [],
    },
  });

  const { fields: intervalFields } = useFieldArray({
    control: intervalLogForm.control,
    name: 'cgatIntervals',
  });

  useEffect(() => {
    if (caseData && open) {
        followUpForm.reset({
            therapistLeavingTime: toTimeInput(caseData.therapistLeavingTime),
            caseOtCallBackWithin15MinsOfExpectedArrival: caseData.caseOtCallBackWithin15MinsOfExpectedArrival || false,
            actualArrivalTime: toTimeInput(caseData.actualArrivalTime),
            expectedFinishTime: toTimeInput(caseData.expectedFinishTime),
            caseOtDidNotCallBack: caseData.caseOtDidNotCallBack || false,
            clerkContactTime: toTimeInput(caseData.clerkContactTime),
            clerkUpdatedExpectedArrivalTimeTime: toTimeInput(caseData.clerkUpdatedExpectedArrivalTimeTime),
            caseOtArriveAfterOfficeHour: caseData.caseOtArriveAfterOfficeHour || false,
            lossOfContact: caseData.lossOfContact || false,
            reportedTo: caseData.reportedTo || '',
            arrivalTimeOutOfOfficeHourNotifiedBuddy: caseData.arrivalTimeOutOfOfficeHourNotifiedBuddy || false,
        });
        closureForm.reset({
            caseClosingTime: toTimeInput(caseData.caseClosingTime),
            actualArrivalTimeOutOfOfficeHour: toTimeInput(caseData.actualArrivalTimeOutOfOfficeHour),
            didNotCallBack15Mins: caseData.didNotCallBack15Mins || false,
            buddyContactTime: toTimeInput(caseData.buddyContactTime),
            updatedExpectedFinishTime: toTimeInput(caseData.updatedExpectedFinishTime),
            buddyLossOfContact: caseData.buddyLossOfContact || false,
            buddyReportedTo: caseData.buddyReportedTo || '',
        });
        
        if (caseData.caseType === 'CGAT') {
            const units = caseData.cgatVisitUnits || [];
            const initialIntervals = units.map((unit, index) => {
                const existing = caseData.cgatIntervals?.[index];
                return {
                    oahName: unit.oahName,
                    inTime: existing ? toTimeInput(existing.inTime) : '',
                    outTime: existing ? toTimeInput(existing.outTime) : '',
                };
            });
            intervalLogForm.reset({ cgatIntervals: initialIntervals });
        }
    }
  }, [caseData, open, followUpForm, closureForm, intervalLogForm]);

  const patientOpdDisplay = useMemo(() => {
    if (!caseData?.patientOPD) return 'N/A';
    return Array.isArray(caseData.patientOPD) ? caseData.patientOPD.join(', ') : String(caseData.patientOPD);
  }, [caseData?.patientOPD]);

  const patientPhoneDisplay = useMemo(() => {
    if (!caseData?.patientPhone) return 'N/A';
    return Array.isArray(caseData.patientPhone) ? caseData.patientPhone.join(', ') : String(caseData.patientPhone);
  }, [caseData?.patientPhone]);

  const isOpeningTherapist = useMemo(() => userProfile?.name === caseData?.openingTherapistId, [userProfile, caseData]);
  const isBuddy = useMemo(() => userProfile?.name === caseData?.buddyTherapistId, [userProfile, caseData]);
  const isClerk = useMemo(() => userProfile?.role === 'Clerk', [userProfile]);
  const isResponsibleClerk = useMemo(() => userProfile?.name === caseData?.responsibleClerkId, [userProfile, caseData]);

  const isCOT = caseData?.caseType === 'COT';
  const isCGAT = caseData?.caseType === 'CGAT';
  
  const isComplete = caseData?.status === 'Complete';

  const isWithin24Hours = useMemo(() => {
    if (!caseData) return false;
    return differenceInHours(new Date(), toDate(caseData.createdAt) || new Date()) < 24;
  }, [caseData]);

  const isInvolvedUser = isOpeningTherapist || isBuddy || isResponsibleClerk || isClerk;

  // COT Phase 1: Clerk and the assigned Buddy OT can edit
  // CGAT Phase 1: Any involved user can edit (Case OT needs to record arrival/departure)
  const canEditPhase1 = useMemo(() => {
    if (isComplete && !isWithin24Hours) return false;
    if (isCOT) return isClerk || isResponsibleClerk || isBuddy;
    return isInvolvedUser;
  }, [isCOT, isClerk, isResponsibleClerk, isBuddy, isComplete, isWithin24Hours, isInvolvedUser]);

  // Phase 1 is "submitted" if it has therapist leaving time and at least one safety status recorded
  const hasPhase1BeenSubmitted = useMemo(() => {
    if (!caseData) return false;
    return !!caseData.therapistLeavingTime && (
        caseData.caseOtCallBackWithin15MinsOfExpectedArrival ||
        caseData.caseOtDidNotCallBack ||
        caseData.arrivalTimeOutOfOfficeHourNotifiedBuddy ||
        caseData.lossOfContact
    );
  }, [caseData]);

  // Phase 2: Clerk and Buddy can edit (as per user instruction for COT, applying generally for safety)
  const canEditPhase2 = useMemo(() => {
    if (isComplete && !isWithin24Hours) return false;
    return isClerk || isBuddy;
  }, [isClerk, isBuddy, isComplete, isWithin24Hours]);

  const canShowPhase2 = hasPhase1BeenSubmitted || isComplete;
  const canSelfRecordCGAT = isCGAT && isOpeningTherapist && !isComplete;

  const combineDateAndTime = (baseDate: Date, timeString: string | undefined): Date | null => {
      if (!timeString) return null;
      try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const newDate = new Date(baseDate);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
      } catch { return null; }
  }
  
  const handleFollowUpSubmit = async (values: z.infer<typeof followUpSchema>, isSubmitMode: boolean) => {
    if (!caseData || !userProfile) return;

    if (isSubmitMode) {
      const isValid = await followUpForm.trigger();
      if (!isValid) return;
    }

    setIsSubmitting(true);
    const baseDate = toDate(caseData.visitDate) || toDate(caseData.createdAt) || new Date();
    const actualArrivalTime = values.caseOtCallBackWithin15MinsOfExpectedArrival ? combineDateAndTime(baseDate, values.actualArrivalTime) : null;
    
    const updateData: Partial<Case> = {
      therapistLeavingTime: combineDateAndTime(baseDate, values.therapistLeavingTime),
      caseOtCallBackWithin15MinsOfExpectedArrival: values.caseOtCallBackWithin15MinsOfExpectedArrival,
      actualArrivalTime: actualArrivalTime,
      expectedFinishTime: values.caseOtCallBackWithin15MinsOfExpectedArrival ? combineDateAndTime(baseDate, values.expectedFinishTime) : null,
      caseOtDidNotCallBack: values.caseOtDidNotCallBack,
      clerkContactTime: values.caseOtDidNotCallBack ? combineDateAndTime(baseDate, values.clerkContactTime) : null,
      clerkUpdatedExpectedArrivalTimeTime: values.caseOtDidNotCallBack ? combineDateAndTime(baseDate, values.clerkUpdatedExpectedArrivalTimeTime) : null,
      caseOtArriveAfterOfficeHour: values.caseOtArriveAfterOfficeHour,
      lossOfContact: values.lossOfContact,
      reportedTo: values.lossOfContact ? values.reportedTo : null,
      arrivalTimeOutOfOfficeHourNotifiedBuddy: values.arrivalTimeOutOfOfficeHourNotifiedBuddy,
    };

    if (isCGAT && actualArrivalTime) {
      const intervals = [...(caseData.cgatIntervals || [])];
      if (intervals.length === 0 && caseData.cgatVisitUnits) {
          caseData.cgatVisitUnits.forEach(u => intervals.push({ oahName: u.oahName, inTime: null, outTime: null }));
      }
      if (intervals[0]) {
          intervals[0].inTime = actualArrivalTime;
          updateData.cgatIntervals = intervals;
      }
    }

    if (isSubmitMode && !isComplete) {
      updateData.status = values.lossOfContact ? 'Complete' : 'To be follow up by clerk/buddy OT';
      if (isClerk && !caseData.responsibleClerkId) updateData.responsibleClerkId = userProfile.name;
    }

    updateCase(caseData.id, updateData);
    toast({ title: isSubmitMode ? "Changes Submitted" : "Progress Saved" });
    setIsSubmitting(false);
  };

  const handleClosureSubmit = async (values: z.infer<typeof closureSchema>, isSubmitMode: boolean) => {
    if (!caseData || !userProfile) return;

    if (isSubmitMode) {
      if (!hasPhase1BeenSubmitted) {
        toast({
          variant: 'destructive',
          title: 'Initial Follow-up Missing',
          description: 'Please complete the Initial Follow-up section before completing the case.',
        });
        return;
      }

      if (isCGAT) {
          const units = caseData.cgatVisitUnits || [];
          const intervals = caseData.cgatIntervals || [];
          const isIntervalLogComplete = units.every((_, index) => {
              const iv = intervals[index];
              const isFirst = index === 0;
              const isLast = index === units.length - 1;
              const inTimeOk = isFirst ? !!caseData.actualArrivalTime : !!iv?.inTime;
              const outTimeOk = isLast ? !!values.caseClosingTime : !!iv?.outTime;
              if (!isFirst && !inTimeOk) return false;
              if (!isLast && !outTimeOk) return false;
              return inTimeOk && outTimeOk;
          });

          if (!isIntervalLogComplete) {
              toast({
                  variant: 'destructive',
                  title: 'Interval Log Incomplete',
                  description: 'For CGAT visits, all middle OAH "In Time" and "Out Time" must be recorded in the Interval Log tab.',
              });
              return;
          }
      }

      const isValid = await closureForm.trigger();
      if (!isValid) return;
    }

    setIsSubmitting(true);
    const baseDate = toDate(caseData.visitDate) || toDate(caseData.createdAt) || new Date();
    const caseClosingTime = combineDateAndTime(baseDate, values.caseClosingTime);
    
    const updateData: Partial<Case> = {
        didNotCallBack15Mins: values.didNotCallBack15Mins,
        buddyContactTime: values.didNotCallBack15Mins ? combineDateAndTime(baseDate, values.buddyContactTime) : null,
        updatedExpectedFinishTime: values.didNotCallBack15Mins ? combineDateAndTime(baseDate, values.updatedExpectedFinishTime) : null,
        buddyLossOfContact: values.buddyLossOfContact,
        buddyReportedTo: values.buddyLossOfContact ? values.buddyReportedTo : null,
        caseClosingTime: caseClosingTime,
        actualArrivalTimeOutOfOfficeHour: combineDateAndTime(baseDate, values.actualArrivalTimeOutOfOfficeHour),
    };

    if (isCGAT && caseClosingTime) {
      const intervals = [...(caseData.cgatIntervals || [])];
      if (intervals.length > 0) {
          intervals[intervals.length - 1].outTime = caseClosingTime;
          updateData.cgatIntervals = intervals;
      }
    }

    if (isSubmitMode && !isComplete) {
      updateData.status = 'Complete';
      if (isClerk && !caseData.responsibleClerkId) updateData.responsibleClerkId = userProfile.name;
    }

    updateCase(caseData.id, updateData);
    toast({ title: isSubmitMode ? "Case Completed" : "Progress Saved" });
    setIsSubmitting(false);
  };

  const handleIntervalSubmit = async (values: z.infer<typeof intervalLogSchema>) => {
    if (!caseData) return;
    setIsSubmitting(true);
    const baseDate = toDate(caseData.visitDate) || toDate(caseData.createdAt) || new Date();
    
    const intervals: CGATIntervalVisit[] = values.cgatIntervals.map((iv, index) => {
        const isFirst = index === 0;
        const isLast = index === values.cgatIntervals.length - 1;
        
        return {
            oahName: iv.oahName,
            inTime: isFirst && caseData.actualArrivalTime 
              ? toDate(caseData.actualArrivalTime) 
              : (iv.inTime ? combineDateAndTime(baseDate, iv.inTime) : null),
            outTime: isLast && caseData.caseClosingTime 
              ? toDate(caseData.caseClosingTime) 
              : (iv.outTime ? combineDateAndTime(baseDate, iv.outTime) : null),
        };
    });

    updateCase(caseData.id, { cgatIntervals: intervals });
    toast({ title: "Interval Log Saved" });
    setIsSubmitting(false);
  };

  const DetailItem = ({label, value}: {label: string, value: any}) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
    
    if (typeof value === 'boolean' && !value) {
        if (label === "Will Return to Department") {
        } else {
            return null;
        }
    }
    
    return (
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</p>
        </div>
    );
  };

  if (!caseData || !userProfile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className='font-headline text-2xl'>Case Detail</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge className={isComplete ? 'bg-green-500 text-white' : 'bg-orange-300 text-black'}>{caseData.status}</Badge>
            <Badge variant="outline">{caseData.caseType} Visit</Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="case-details" className="flex-grow min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="case-details">Summary</TabsTrigger>
                {isCGAT && <TabsTrigger value="interval-log">Interval Log</TabsTrigger>}
                <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="case-details" className="flex-1 overflow-y-auto pr-4 mt-4 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <DetailItem label="Visit Date" value={format(toDate(caseData.visitDate) || toDate(caseData.createdAt)!, 'dd/MM/yyyy')} />
                    {isCOT && <DetailItem label="Patient OPD" value={patientOpdDisplay} />}
                    {isCOT && <DetailItem label="Patient Phone" value={patientPhoneDisplay} />}
                    {isCOT && <DetailItem label="Home Visit District" value={caseData.homeVisitDistrict} />}
                    
                    {isCGAT && caseData.cgatVisitUnits && (
                        <div className="col-span-2 space-y-3">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Visiting Locations & Patients</p>
                            <div className="grid gap-3">
                                {caseData.cgatVisitUnits.map((unit, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg bg-muted/20">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-primary text-lg">{unit.oahName}</p>
                                            <p className="text-base text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" /> {unit.oahPhone}</p>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {unit.patients.map((opd, pIdx) => (
                                                <Badge key={pIdx} variant="outline" className="text-sm px-3 py-1 bg-background shadow-sm border-primary/30 font-bold">OPD: {opd}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DetailItem label="Case Therapist" value={caseData.openingTherapistId} />
                    <DetailItem label="Therapist Phone" value={caseData.therapistPhone} />
                    <DetailItem label="Buddy Therapist" value={caseData.buddyTherapistId} />
                    <DetailItem label="Will Return to Department" value={caseData.willOtReturnToDepartment} />
                    <Separator className="col-span-2" />
                    <DetailItem label="Leaving Dept" value={formatTime24h(caseData.therapistLeavingTime)} />
                    <DetailItem label="Expected Arrival Time" value={formatTime24h(caseData.expectedArrivalTime)} />
                    <DetailItem label={isCGAT ? "Arrival Time to First OAH" : "Actual Arrival"} value={formatTime24h(caseData.actualArrivalTime)} />
                    <DetailItem label={isCGAT ? "Expected Last OAH Finish Time" : "Expected Finish Time"} value={formatTime24h(caseData.expectedFinishTime)} />
                    
                    {caseData.caseOtDidNotCallBack && caseData.clerkContactTime ? (
                        <DetailItem label="Case OT not call back, Clerk Contact on" value={formatTime24h(caseData.clerkContactTime)} />
                    ) : (
                        <DetailItem label="Clerk Contact Time" value={formatTime24h(caseData.clerkContactTime)} />
                    )}

                    <DetailItem label="Updated Expected Arrival Time" value={formatTime24h(caseData.clerkUpdatedExpectedArrivalTimeTime)} />
                    <DetailItem label="Arrival time out of office hour, notified Buddy OT" value={caseData.arrivalTimeOutOfOfficeHourNotifiedBuddy} />
                    <DetailItem label="Loss of Contact with Case Therapist" value={caseData.lossOfContact} />
                    <DetailItem label="Reported To" value={caseData.reportedTo} />
                    <Separator className="col-span-2" />
                    
                    {caseData.didNotCallBack15Mins && caseData.buddyContactTime ? (
                        <DetailItem label="Case OT did not call back, Buddy OT contact on" value={formatTime24h(caseData.buddyContactTime)} />
                    ) : (
                        <>
                            <DetailItem label="Buddy OT Notification" value={caseData.didNotCallBack15Mins} />
                            <DetailItem label="Buddy Contact Time" value={formatTime24h(caseData.buddyContactTime)} />
                        </>
                    )}

                    <DetailItem label="Updated Expected Finish Time" value={formatTime24h(caseData.updatedExpectedFinishTime)} />
                    <DetailItem label="Loss of Contact with Case Therapist" value={caseData.buddyLossOfContact} />
                    <DetailItem label="Reported To (Buddy)" value={caseData.buddyReportedTo} />
                    <DetailItem label="Actual Arrival (Out of Office Hour)" value={formatTime24h(caseData.actualArrivalTimeOutOfOfficeHour)} />
                    <DetailItem label={isCGAT ? "Last OAH finish time" : "Home visit finish time"} value={formatTime24h(caseData.caseClosingTime)} />
                </div>

                <div className="pt-6 border-t">
                    <Form {...followUpForm}>
                        <form className="space-y-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><Clock className="h-5 w-5" /> Initial Follow-up</h3>
                            
                            <FormField control={followUpForm.control} name="therapistLeavingTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time of therapist leaving department</FormLabel>
                                    <FormControl>
                                        <TimeInput 
                                            {...field} 
                                            disabled={!canEditPhase1 || isSubmitting}
                                            onSetNow={() => followUpForm.setValue('therapistLeavingTime', format(new Date(), 'HH:mm'))} 
                                            onClear={() => followUpForm.setValue('therapistLeavingTime', '')}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="space-y-4">
                                <FormField control={followUpForm.control} name="caseOtCallBackWithin15MinsOfExpectedArrival" render={({ field }) => (
                                    <FormItem className="rounded-md border p-4 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox 
                                                disabled={!canEditPhase1 || isSubmitting}
                                                checked={field.value} 
                                                onCheckedChange={(c) => {
                                                    field.onChange(c);
                                                    if (c) { 
                                                        followUpForm.setValue('arrivalTimeOutOfOfficeHourNotifiedBuddy', false);
                                                        followUpForm.setValue('lossOfContact', false); 
                                                    }
                                                }} 
                                            />
                                            <FormLabel className="cursor-pointer flex items-center gap-1"><Phone className="h-4 w-4" /> {isCGAT ? "Arrival Time to First OAH (called back)" : "Therapist called back within 15 mins"}</FormLabel>
                                        </div>
                                        {field.value && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                <FormField control={followUpForm.control} name="actualArrivalTime" render={({ field: f }) => (
                                                    <FormItem><FormLabel>{isCGAT ? "Arrival Time to First OAH" : "Actual Arrival"}</FormLabel><TimeInput disabled={!canEditPhase1 || isSubmitting} {...f} onSetNow={() => followUpForm.setValue('actualArrivalTime', format(new Date(), 'HH:mm'))} onClear={() => followUpForm.setValue('actualArrivalTime', '')} /></FormItem>
                                                )} />
                                                <FormField control={followUpForm.control} name="expectedFinishTime" render={({ field: f }) => (
                                                    <FormItem>
                                                      <FormLabel>{isCGAT ? "Expected Last OAH Finish Time" : "Expected Finish Time"}</FormLabel>
                                                      <TimeInput disabled={!canEditPhase1 || isSubmitting} {...f} onClear={() => followUpForm.setValue('expectedFinishTime', '')} />
                                                      <Alert className="mt-2 bg-yellow-50 border-yellow-200 py-3 px-4">
                                                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                                          <AlertDescription className="text-base leading-tight font-bold text-yellow-900">
                                                              Please inform Buddy to follow up if Case OT cannot finish home visit before office hour.
                                                          </AlertDescription>
                                                      </Alert>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        )}
                                    </FormItem>
                                )} />

                                <FormField control={followUpForm.control} name="caseOtDidNotCallBack" render={({ field }) => (
                                    <FormItem className="rounded-md border p-4 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox 
                                                disabled={!canEditPhase1 || isSubmitting}
                                                checked={field.value} 
                                                onCheckedChange={(c) => {
                                                    field.onChange(c);
                                                    if (c) { 
                                                        followUpForm.setValue('arrivalTimeOutOfOfficeHourNotifiedBuddy', false);
                                                        followUpForm.setValue('lossOfContact', false); 
                                                    }
                                                }} 
                                            />
                                            <FormLabel className="cursor-pointer">Therapist did NOT call back within 15 mins</FormLabel>
                                        </div>
                                        {field.value && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                <FormField control={followUpForm.control} name="clerkContactTime" render={({ field: f }) => (
                                                    <FormItem><FormLabel>Clerk Contact Time</FormLabel><TimeInput disabled={!canEditPhase1 || isSubmitting} {...f} onSetNow={() => followUpForm.setValue('clerkContactTime', format(new Date(), 'HH:mm'))} onClear={() => followUpForm.setValue('clerkContactTime', '')} /></FormItem>
                                                )} />
                                                <FormField control={followUpForm.control} name="clerkUpdatedExpectedArrivalTimeTime" render={({ field: f }) => (
                                                    <FormItem><FormLabel>Updated Expected Arrival Time</FormLabel><TimeInput disabled={!canEditPhase1 || isSubmitting} {...f} onClear={() => followUpForm.setValue('clerkUpdatedExpectedArrivalTimeTime', '')} /></FormItem>
                                                )} />
                                            </div>
                                        )}
                                    </FormItem>
                                )} />

                                <FormField control={followUpForm.control} name="arrivalTimeOutOfOfficeHourNotifiedBuddy" render={({ field }) => (
                                    <FormItem className="rounded-md border p-4">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox 
                                                disabled={!canEditPhase1 || isSubmitting}
                                                checked={field.value} 
                                                onCheckedChange={(c) => {
                                                    field.onChange(c);
                                                    if (c) { 
                                                        followUpForm.setValue('caseOtCallBackWithin15MinsOfExpectedArrival', false);
                                                        followUpForm.setValue('caseOtDidNotCallBack', false);
                                                        followUpForm.setValue('lossOfContact', false); 
                                                    }
                                                }} 
                                            />
                                            <FormLabel className="cursor-pointer">Arrival time out of office hour, notified Buddy OT</FormLabel>
                                        </div>
                                    </FormItem>
                                )} />
                                
                                <FormField control={followUpForm.control} name="lossOfContact" render={({ field }) => (
                                    <FormItem className="rounded-md border p-4 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox 
                                                disabled={!canEditPhase1 || isSubmitting}
                                                checked={field.value} 
                                                onCheckedChange={(c) => {
                                                    field.onChange(c);
                                                    if (c) { 
                                                        followUpForm.setValue('caseOtCallBackWithin15MinsOfExpectedArrival', false);
                                                        followUpForm.setValue('caseOtDidNotCallBack', false);
                                                        followUpForm.setValue('arrivalTimeOutOfOfficeHourNotifiedBuddy', false);
                                                    }
                                                }} 
                                            />
                                            <FormLabel className="cursor-pointer flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Loss of Contact with Case Therapist</FormLabel>
                                        </div>
                                        {field.value && (
                                            <div className="pt-2 border-t"><FormField control={followUpForm.control} name="reportedTo" render={({ field: f }) => (
                                                <FormItem><FormLabel>Reported To</FormLabel><Input disabled={!canEditPhase1 || isSubmitting} {...f} placeholder="Senior OT / Dept Head" /></FormItem>
                                            )} /></div>
                                        )}
                                    </FormItem>
                                )} />
                            </div>

                            {canEditPhase1 && (
                                <div className="flex gap-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-1" 
                                        disabled={isSubmitting}
                                        onClick={() => handleFollowUpSubmit(followUpForm.getValues(), false)}
                                    >
                                        Save Progress
                                    </Button>
                                    <Button 
                                        type="button" 
                                        className="flex-1" 
                                        disabled={isSubmitting}
                                        onClick={() => handleFollowUpSubmit(followUpForm.getValues(), true)}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Changes"}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                {canShowPhase2 && (
                    <div className="pt-6 border-t">
                        <Form {...closureForm}>
                            <form className="space-y-6">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /> Visit Completion</h3>
                                
                                <FormField control={closureForm.control} name="caseClosingTime" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isCGAT ? "Last OAH Finish Time (called back)" : "Home visit finish time"}</FormLabel>
                                        <TimeInput {...field} disabled={!canEditPhase2 || isSubmitting} onSetNow={() => closureForm.setValue('caseClosingTime', format(new Date(), 'HH:mm'))} onClear={() => closureForm.setValue('caseClosingTime', '')} />
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={closureForm.control} name="didNotCallBack15Mins" render={({ field }) => (
                                    <FormItem className="rounded-md border p-4 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox disabled={!canEditPhase2 || isSubmitting} checked={field.value} onCheckedChange={(c) => {
                                                field.onChange(c);
                                                if (c) { 
                                                    closureForm.setValue('buddyLossOfContact', false); 
                                                }
                                            }} />
                                            <FormLabel className="cursor-pointer">Therapist did NOT call back within 15 mins</FormLabel>
                                        </div>
                                        {field.value && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                                <FormField control={closureForm.control} name="buddyContactTime" render={({ field: f }) => (
                                                    <FormItem><FormLabel>Buddy Contact Time</FormLabel><TimeInput disabled={!canEditPhase2 || isSubmitting} {...f} onSetNow={() => closureForm.setValue('buddyContactTime', format(new Date(), 'HH:mm'))} onClear={() => closureForm.setValue('buddyContactTime', '')} /></FormItem>
                                                )} />
                                                <FormField control={closureForm.control} name="updatedExpectedFinishTime" render={({ field: f }) => (
                                                    <FormItem><FormLabel>Updated Expected Finish Time</FormLabel><TimeInput disabled={!canEditPhase2 || isSubmitting} {...f} onClear={() => closureForm.setValue('updatedExpectedFinishTime', '')} /></FormItem>
                                                )} />
                                            </div>
                                        )}
                                    </FormItem>
                                )} />

                                <FormField control={closureForm.control} name="buddyLossOfContact" render={({ field }) => (
                                    <FormItem className="rounded-md border p-4 space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox disabled={!canEditPhase2 || isSubmitting} checked={field.value} onCheckedChange={field.onChange} />
                                            <FormLabel className="cursor-pointer flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Loss of Contact with Case Therapist</FormLabel>
                                        </div>
                                        {field.value && (
                                            <div className="pt-2 border-t"><FormField control={closureForm.control} name="buddyReportedTo" render={({ field: f }) => (
                                                <FormItem><FormLabel>Reported To</FormLabel><Input disabled={!canEditPhase2 || isSubmitting} {...f} placeholder="Senior OT / Dept Head" /></FormItem>
                                            )} /></div>
                                        )}
                                    </FormItem>
                                )} />

                                <div className="flex gap-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-1" 
                                        disabled={!canEditPhase2 || isSubmitting}
                                        onClick={() => handleClosureSubmit(closureForm.getValues(), false)}
                                    >
                                        Save Progress
                                    </Button>
                                    <Button 
                                        type="button" 
                                        className="flex-1" 
                                        disabled={!canEditPhase2 || isSubmitting}
                                        onClick={() => handleClosureSubmit(closureForm.getValues(), true)}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Case"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                )}
            </TabsContent>

            {isCGAT && (
                <TabsContent value="interval-log" className="flex-1 overflow-y-auto pr-4 mt-4">
                    <Form {...intervalLogForm}>
                        <form onSubmit={intervalLogForm.handleSubmit(handleIntervalSubmit)} className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><History className="h-5 w-5" /> Interval OAH Visits</h3>
                                {canSelfRecordCGAT && (
                                    <Button type="submit" size="sm" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                        Save Interval Log
                                    </Button>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {intervalFields.map((field, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === intervalFields.length - 1;
                                    
                                    return (
                                        <div key={field.id} className="p-4 border rounded-lg bg-muted/30">
                                            <div className="flex justify-between items-center mb-4">
                                                <Badge variant="outline">{index + 1}</Badge>
                                                <p className="font-bold flex-1 ml-3">{field.oahName}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={intervalLogForm.control} name={`cgatIntervals.${index}.inTime`} render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>In Time</FormLabel>
                                                        <FormControl>
                                                            <TimeInput 
                                                                {...f} 
                                                                disabled={!canSelfRecordCGAT || isFirst || isSubmitting} 
                                                                value={isFirst ? toTimeInput(caseData.actualArrivalTime) : f.value}
                                                                onSetNow={() => intervalLogForm.setValue(`cgatIntervals.${index}.inTime`, format(new Date(), 'HH:mm'))} 
                                                                onClear={() => intervalLogForm.setValue(`cgatIntervals.${index}.inTime`, '')}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={intervalLogForm.control} name={`cgatIntervals.${index}.outTime`} render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Out Time</FormLabel>
                                                        <FormControl>
                                                            <TimeInput 
                                                                {...f} 
                                                                disabled={!canSelfRecordCGAT || isLast || isSubmitting} 
                                                                value={isLast ? toTimeInput(caseData.caseClosingTime) : f.value}
                                                                onSetNow={() => intervalLogForm.setValue(`cgatIntervals.${index}.outTime`, format(new Date(), 'HH:mm'))} 
                                                                onClear={() => intervalLogForm.setValue(`cgatIntervals.${index}.outTime`, '')}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            {(isFirst || isLast) && (
                                                <p className="text-[10px] text-muted-foreground mt-2 italic">
                                                    * This time is automatically synced from the safety follow-up records.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </form>
                    </Form>
                </TabsContent>
            )}

            <TabsContent value="risk-assessment" className="flex-1 overflow-y-auto pr-4 mt-4">
                <RiskFactorChecklistDisplay checklist={caseData.riskFactorChecklist} />
            </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 mt-auto border-t">
            <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
