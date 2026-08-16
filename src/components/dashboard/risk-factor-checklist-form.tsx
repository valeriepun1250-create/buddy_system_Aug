'use client';

import type { RefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { useFormField } from '../ui/form';

const humanFactorsSchema = z.object({
    unstableMentalState: z.boolean(),
    unstableMentalStateDetails: z.string(),
    violenceBehavior: z.boolean(),
    violenceBehaviorDetails: z.string(),
    sexualConviction: z.boolean(),
    sexualConvictionDetails: z.string(),
    drugAbuse: z.boolean(),
    drugAbuseDetails: z.string(),
    infectiousDisease: z.boolean(),
    infectiousDiseaseDetails: z.string(),
    humanFactorsOthers: z.boolean(),
    humanFactorsOthersDetails: z.string(),
});

const environmentalFactorsSchema = z.object({
    unclearAddress: z.boolean(),
    crimeZone: z.boolean(),
    dangerousWay: z.boolean(),
    networkBlackSpots: z.boolean(),
    animalsBite: z.boolean(),
    severeHygiene: z.boolean(),
    environmentalFactorsOthers: z.boolean(),
    environmentalFactorsOthersDetails: z.string(),
});

export const riskFactorChecklistSchema = z.object({
  informationSources: z.array(z.string()).min(2, 'You have to select at least two items.'),
  humanFactors: humanFactorsSchema,
  environmentalFactors: environmentalFactorsSchema,
  noRiskFactors: z.boolean(),
}).superRefine((data, ctx) => {
    const hasHumanFactorRisk = Object.values(data.humanFactors).some(val => val === true);
    const hasEnvironmentalFactorRisk = Object.values(data.environmentalFactors).some(val => val === true);

    if (!hasHumanFactorRisk && !hasEnvironmentalFactorRisk && !data.noRiskFactors) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['noRiskFactors'],
            message: ' ', // No message, just trigger error state
        });
    }
});


interface RiskFactorChecklistFormProps {
  form: UseFormReturn<any>;
  noRiskFactorCheckboxRef: RefObject<HTMLButtonElement>;
}

const infoSources = [
  { id: 'cms', label: 'CMS' },
  { id: 'patient', label: 'Patient' },
  { id: 'relatives', label: 'Relatives' },
  { id: 'others', label: 'Others' },
] as const;

export function RiskFactorChecklistForm({ form, noRiskFactorCheckboxRef }: RiskFactorChecklistFormProps) {
    const riskFactorErrors = form.formState.errors.riskFactorChecklist as
        | { noRiskFactors?: unknown }
        | undefined;
    
    const renderFactor = (
        section: 'humanFactors' | 'environmentalFactors',
        fieldName: string,
        label: string,
        detailsLabel: string,
        isOther: boolean = false
    ) => (
        <FormField
            control={form.control}
            name={`riskFactorChecklist.${section}.${fieldName}`}
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none w-full">
                        <FormLabel>{label}</FormLabel>
                        {field.value && (
                            <FormField
                                control={form.control}
                                name={`riskFactorChecklist.${section}.${fieldName}Details`}
                                render={({ field: detailsField }) => (
                                    <FormItem className='pt-2'>
                                        <FormLabel className='sr-only'>{detailsLabel}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={detailsLabel} {...detailsField} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </FormItem>
            )}
        />
    );


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Information collected from</h3>
        <p className="text-sm text-muted-foreground">(should be at least 2 sources)</p>
        <FormField
          control={form.control}
          name="riskFactorChecklist.informationSources"
          render={() => (
            <FormItem className="space-y-2 pt-2">
              {infoSources.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="riskFactorChecklist.informationSources"
                  render={({ field }) => {
                    return (
                      <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(field.value?.filter((value: string) => value !== item.id));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Human Factors</h3>
        <div className="space-y-4 pt-2">
            {renderFactor('humanFactors', 'unstableMentalState', 'Recent history of unstable mental state (e.g. unstable mood, psychotic symptoms, etc.)', 'If yes, please state date and referred condition/disease')}
            {renderFactor('humanFactors', 'violenceBehavior', 'Recent history of violence behavior', 'If yes, please state date and referred condition/disease')}
            {renderFactor('humanFactors', 'sexualConviction', 'History of sexual conviction', 'If yes, please state date and referred condition/disease')}
            {renderFactor('humanFactors', 'drugAbuse', 'History of drug/ alcohol/ substance abuse', 'If yes, please state date and referred condition/disease')}
            {renderFactor('humanFactors', 'infectiousDisease', 'Suspected to have infectious disease', 'If yes, please state date and referred condition/disease')}
            {renderFactor('humanFactors', 'humanFactorsOthers', 'Others', 'Please specify')}
        </div>
      </div>
      
      <Separator />

      <div>
        <h3 className="text-lg font-medium">Environmental Factors</h3>
        <p className="text-sm text-muted-foreground">Please also be aware of the environmental factors during the home visit</p>
        <div className="space-y-4 pt-2">
            {renderFactor('environmentalFactors', 'unclearAddress', 'The address of patient is not clear', 'Details')}
            {renderFactor('environmentalFactors', 'crimeZone', "Patient's home is near the crime zone", 'Details')}
            {renderFactor('environmentalFactors', 'dangerousWay', "There has potential dangerous along the way to patient's home (e.g. dark staircase, congested corridor, etc.)", 'Details')}
            {renderFactor('environmentalFactors', 'networkBlackSpots', 'There is mobile phone network black spots', 'Details')}
            {renderFactor('environmentalFactors', 'animalsBite', 'Potential dog/ animals bite', 'Details')}
            {renderFactor('environmentalFactors', 'severeHygiene', 'Predict to have severe hygiene problem (e.g. hoarding behavior, poor social support with prolonged hospital stay', 'Details')}
            {renderFactor('environmentalFactors', 'environmentalFactorsOthers', 'Others', 'Please specify')}
        </div>
      </div>

      <Separator />

      <div>
          <FormField
              control={form.control}
              name="riskFactorChecklist.noRiskFactors"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                          <Checkbox
                            ref={noRiskFactorCheckboxRef}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                      </FormControl>
                      <div className="space-y-1 leading-none w-full">
                          <FormLabel className={cn(Boolean(riskFactorErrors?.noRiskFactors) && 'text-destructive')}>
                              No human and environmental risk factor
                          </FormLabel>
                          <FormMessage />
                      </div>
                  </FormItem>
              )}
          />
      </div>


       <div>
        <p className="text-sm text-muted-foreground font-semibold">
          If there is any identified risk factor, therapist should report to supervisor prior to home visit.
        </p>
      </div>

    </div>
  );
}
