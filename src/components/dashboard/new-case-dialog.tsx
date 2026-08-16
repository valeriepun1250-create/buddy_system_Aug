'use client';

import { useForm, useFieldArray, Control, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/components/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { RiskFactorChecklistForm, riskFactorChecklistSchema } from './risk-factor-checklist-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TimeInput } from '../ui/time-input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { Case, CGATVisitUnit } from '@/lib/types';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

interface NewCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Case | null;
  caseType: 'COT' | 'CGAT' | null;
}

const defaultChecklist = {
  informationSources: [],
  humanFactors: {
      unstableMentalState: false,
      unstableMentalStateDetails: '',
      violenceBehavior: false,
      violenceBehaviorDetails: '',
      sexualConviction: false,
      sexualConvictionDetails: '',
      drugAbuse: false,
      drugAbuseDetails: '',
      infectiousDisease: false,
      infectiousDiseaseDetails: '',
      humanFactorsOthers: false,
      humanFactorsOthersDetails: '',
  },
  environmentalFactors: {
      unclearAddress: false,
      crimeZone: false,
      dangerousWay: false,
      networkBlackSpots: false,
      animalsBite: false,
      severeHygiene: false,
      environmentalFactorsOthers: false,
      environmentalFactorsOthersDetails: '',
  },
  noRiskFactors: false,
};

function PatientOPDList({ control, oahIndex }: { control: Control<any>, oahIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `cgatVisits.${oahIndex}.patients`,
  });

  const patientValues = useWatch({
    control,
    name: `cgatVisits.${oahIndex}.patients`,
  });

  const isLastPatientEmpty = patientValues && patientValues.length > 0 
    ? !patientValues[patientValues.length - 1].opd.trim() 
    : false;

  return (
    <div className="pl-6 space-y-3 border-l-2 border-primary/20">
      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Visiting Patients</FormLabel>
      {fields.map((field, pIndex) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`cgatVisits.${oahIndex}.patients.${pIndex}.opd`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder={`Patient ${pIndex + 1} OPD Code`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {fields.length > 1 && (
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(pIndex)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="w-full border-dashed"
        onClick={() => append({ opd: '' })}
        disabled={isLastPatientEmpty}
      >
        <PlusCircle className="mr-2 h-3 w-3" /> Add Visiting Patient
      </Button>
    </div>
  );
}

function CGATVisitUnit({ control, index, removeOAH }: { control: Control<any>, index: number, removeOAH: (idx: number) => void }) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <h4 className="font-bold text-primary">Old Age Home {index + 1}</h4>
        {index > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => removeOAH(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`cgatVisits.${index}.oahName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>OAH Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Happy Valley OAH" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`cgatVisits.${index}.oahPhone`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>OAH Telephone</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2345 6789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <PatientOPDList control={control} oahIndex={index} />
    </div>
  );
}

export function NewCaseDialog({ open, onOpenChange, initialData, caseType }: NewCaseDialogProps) {
  const { userProfile, users, addCase } = useAppContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('case-details');
  const [isRiskChecklistInvalid, setIsRiskChecklistInvalid] = useState(false);
  const noRiskFactorCheckboxRef = useRef<HTMLButtonElement>(null);

  const formSchema = useMemo(() => {
    return z.object({
      patientOPD: z.string().optional(),
      patientPhone: z.string().optional(),
      homeVisitDistrict: z.string().optional(),
      cgatVisits: z.array(z.object({
        oahName: z.string().optional(),
        oahPhone: z.string().optional(),
        patients: z.array(z.object({ opd: z.string().optional() })).optional(),
      })).optional(),
      therapistPhone: z.string().min(1, "Therapist's phone is required"),
      buddyTherapistId: z.string().min(1, 'Buddy therapist is required'),
      expectedArrivalTime: z.string().min(1, 'Expected arrival time is required'),
      willOtReturnToDepartment: z.string({ required_error: "You must select an option."}).transform(val => val === 'true'),
      riskFactorChecklist: riskFactorChecklistSchema,
    }).superRefine((data, ctx) => {
      if (userProfile && data.buddyTherapistId === userProfile.name) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['buddyTherapistId'], message: "You cannot select yourself as the buddy therapist" });
      }

      if (caseType === 'COT') {
        if (!data.patientOPD || data.patientOPD.trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['patientOPD'], message: "Patient OPD is required for COT visits" });
        }
        if (!data.patientPhone || data.patientPhone.trim() === '') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['patientPhone'], message: "Patient Phone is required for COT visits" });
        }
      } else if (caseType === 'CGAT') {
        if (!data.cgatVisits || data.cgatVisits.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cgatVisits'], message: "At least one OAH visit is required" });
        } else {
          data.cgatVisits.forEach((visit, idx) => {
            if (!visit.oahName || visit.oahName.trim() === '') {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cgatVisits', idx, 'oahName'], message: "OAH Name is required" });
            }
            if (!visit.oahPhone || visit.oahPhone.trim() === '') {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cgatVisits', idx, 'oahPhone'], message: "OAH Phone is required" });
            }
            if (!visit.patients || visit.patients.length === 0 || visit.patients.some(p => !p.opd || p.opd.trim() === '')) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cgatVisits', idx, 'patients'], message: "All visiting patients must have an OPD code" });
            }
          });
        }
      }
    });
  }, [caseType, userProfile]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientOPD: '',
      patientPhone: '',
      homeVisitDistrict: '',
      cgatVisits: [{ oahName: '', oahPhone: '', patients: [{ opd: '' }] }],
      therapistPhone: '',
      buddyTherapistId: '',
      expectedArrivalTime: '',
      willOtReturnToDepartment: undefined,
      riskFactorChecklist: defaultChecklist,
    },
  });

  const { fields: oahFields, append: appendOAH, remove: removeOAH } = useFieldArray({
    control: form.control,
    name: 'cgatVisits',
  });

  const cgatVisits = useWatch({
    control: form.control,
    name: 'cgatVisits',
  });

  const isLastOAHIncomplete = cgatVisits && cgatVisits.length > 0
    ? !cgatVisits[cgatVisits.length - 1].oahName?.trim() || 
      !cgatVisits[cgatVisits.length - 1].oahPhone?.trim() ||
      cgatVisits[cgatVisits.length - 1].patients?.some((p: any) => !p.opd?.trim())
    : false;

  useEffect(() => {
    if (open) {
      if (initialData) {
        let initialCgatVisits: any[] = [{ oahName: '', oahPhone: '', patients: [{ opd: '' }] }];
        
        if (initialData.caseType === 'CGAT' && initialData.cgatVisitUnits) {
          initialCgatVisits = initialData.cgatVisitUnits.map(unit => ({
            oahName: unit.oahName,
            oahPhone: unit.oahPhone,
            patients: unit.patients.map(p => ({ opd: p }))
          }));
        }

        form.reset({
          patientOPD: initialData.caseType === 'COT' ? initialData.patientOPD[0] : '',
          patientPhone: initialData.caseType === 'COT' ? initialData.patientPhone[0] : '',
          homeVisitDistrict: initialData.homeVisitDistrict || '',
          cgatVisits: initialCgatVisits,
          therapistPhone: initialData.therapistPhone || '',
          buddyTherapistId: initialData.buddyTherapistId === userProfile?.name ? '' : initialData.buddyTherapistId,
          expectedArrivalTime: '',
          willOtReturnToDepartment: initialData.willOtReturnToDepartment === undefined ? undefined : String(initialData.willOtReturnToDepartment),
          riskFactorChecklist: initialData.riskFactorChecklist || defaultChecklist,
        });
      } else {
        form.reset({
            patientOPD: '',
            patientPhone: '',
            homeVisitDistrict: '',
            cgatVisits: [{ oahName: '', oahPhone: '', patients: [{ opd: '' }] }],
            therapistPhone: '',
            buddyTherapistId: '',
            expectedArrivalTime: '',
            willOtReturnToDepartment: undefined,
            riskFactorChecklist: defaultChecklist,
        });
      }
      setActiveTab('case-details');
      setIsRiskChecklistInvalid(false);
    }
  }, [initialData, open, form, userProfile?.name]);
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setIsRiskChecklistInvalid(false);
      setActiveTab('case-details');
    }
    onOpenChange(isOpen);
  };

  const onInvalidSubmit = (errors: any) => {
    if (errors.riskFactorChecklist) {
        setActiveTab('risk-checklist');
        setIsRiskChecklistInvalid(true);
        if (errors.riskFactorChecklist.noRiskFactors) {
            setTimeout(() => {
                noRiskFactorCheckboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    } else {
        setIsRiskChecklistInvalid(false);
    }
  }

  async function onSubmit(values: any) {
    if (!userProfile || !caseType) return;
    
    const today = new Date();
    const [hours, minutes] = values.expectedArrivalTime.split(':');
    const expectedArrivalTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));

    let patientOPD: string[] = [];
    let patientPhone: string[] = [];
    let oahNames: string[] = [];
    let cgatVisitUnits: CGATVisitUnit[] = [];

    if (caseType === 'CGAT' && values.cgatVisits) {
      values.cgatVisits.forEach((unit: any) => {
        const opds = unit.patients.map((p: any) => p.opd?.trim()).filter(Boolean);
        if (opds.length > 0) {
          cgatVisitUnits.push({
            oahName: unit.oahName,
            oahPhone: unit.oahPhone,
            patients: opds
          });
          oahNames.push(unit.oahName);
          patientPhone.push(unit.oahPhone);
          patientOPD.push(...opds);
        }
      });
    } else {
      patientOPD = [values.patientOPD || ''];
      patientPhone = [values.patientPhone || ''];
      oahNames = [];
    }

    const caseData: any = {
      caseType,
      patientOPD,
      patientPhone,
      oahNames,
      therapistPhone: values.therapistPhone,
      buddyTherapistId: values.buddyTherapistId,
      expectedArrivalTime,
      willOtReturnToDepartment: values.willOtReturnToDepartment,
      riskFactorChecklist: values.riskFactorChecklist,
      openingTherapistId: userProfile.name,
      homeVisitDistrict: values.homeVisitDistrict || '',
    };

    if (caseType === 'CGAT') {
      caseData.cgatVisitUnits = cgatVisitUnits;
    }

    // We initiate the call but don't await the server result to keep UI snappy
    // and prevent double submission by closing the dialog immediately.
    addCase(caseData);

    toast({
      title: initialData ? 'Case Copied' : 'Case Created',
      description: `Case has been successfully initiated.`,
    });

    form.reset();
    handleOpenChange(false);
  }
  
  const therapists = users.filter(u => u.role === 'Case Therapist' && u.name !== userProfile?.name && u.approved);

  let title = 'Open a New Case';
  if (initialData) {
      title = 'Copy and Create New Case';
  } else if (caseType) {
      title = `Open a New ${caseType} Case`;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="flex flex-col h-full overflow-hidden">
            <DialogHeader>
              <DialogTitle className='font-headline text-2xl'>{title}</DialogTitle>
              <DialogDescription>
                {initialData ? "The information from the original case has been pre-filled." : 'Fill in the details to create a new home visit case.'}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(tab) => {
              if (tab === 'case-details') {
                form.trigger('riskFactorChecklist').then(isValid => {
                    setIsRiskChecklistInvalid(!isValid);
                });
              }
              setActiveTab(tab)
            }} className="flex-1 overflow-hidden flex flex-col py-4">
              <TabsList className="grid w-full grid-cols-2 bg-primary/10 p-1 h-auto shrink-0">
                <TabsTrigger value="case-details" className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'>Case Details</TabsTrigger>
                <TabsTrigger value="risk-checklist" className={cn(
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                    isRiskChecklistInvalid && 'bg-destructive/20 text-destructive-foreground data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground'
                )}>Risk Checklist</TabsTrigger>
              </TabsList>
              
              <TabsContent value="case-details" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6">
                {caseType === 'COT' ? (
                  <div className="grid gap-4 p-4 border rounded-lg bg-card shadow-sm">
                    <h4 className="font-bold text-primary mb-2">Visit Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="patientOPD"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient OPD Code</FormLabel>
                            <FormControl><Input placeholder="e.g., 1234567x" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="patientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Phone</FormLabel>
                            <FormControl><Input placeholder="e.g., 1234-5678" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="homeVisitDistrict"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home visit district</FormLabel>
                          <FormControl><Input placeholder="e.g., Yau Tsim Mong" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {oahFields.map((field, index) => (
                      <CGATVisitUnit key={field.id} control={form.control} index={index} removeOAH={removeOAH} />
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-2 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={() => appendOAH({ oahName: '', oahPhone: '', patients: [{ opd: '' }] })}
                      disabled={isLastOAHIncomplete || form.formState.isSubmitting}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New Old Age Home Visit
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="therapistPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Therapist's Phone</FormLabel>
                        <FormControl><Input placeholder="e.g., 3506-1234" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buddyTherapistId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buddy Therapist</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a buddy therapist" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {therapists.map(therapist => (
                                <SelectItem key={therapist.name} value={therapist.name}>
                                    {therapist.name}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedArrivalTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Arrival Time</FormLabel>
                        <FormControl><TimeInput {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="willOtReturnToDepartment"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Will Case Therapist return to department?</FormLabel>
                        <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            value={String(field.value)}
                            className="flex items-center space-x-4"
                        >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="true" /></FormControl>
                                <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="false" /></FormControl>
                                <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="risk-checklist" className="flex-1 overflow-y-auto pr-2 mt-4">
                <RiskFactorChecklistForm form={form} noRiskFactorCheckboxRef={noRiskFactorCheckboxRef} />
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="shrink-0 pt-4 border-t mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary text-primary-foreground"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Case'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
