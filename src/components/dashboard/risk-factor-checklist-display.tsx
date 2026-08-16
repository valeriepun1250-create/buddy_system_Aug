'use client';

import type { RiskFactorChecklist } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CheckSquare, Square } from "lucide-react";
import { Separator } from "../ui/separator";

interface RiskFactorChecklistDisplayProps {
    checklist: RiskFactorChecklist | undefined;
}

const DetailItem = ({ label, checked, details }: { label: string, checked: boolean, details?: string | null }) => (
    <div className="flex items-start gap-3 py-2">
        <div>{checked ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground/50" />}</div>
        <div className="flex-1">
            <p className={`font-medium ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
            {checked && details && (
                <p className="text-sm text-primary mt-1 pl-2 border-l-2 border-primary">{details}</p>
            )}
        </div>
    </div>
);


export function RiskFactorChecklistDisplay({ checklist }: RiskFactorChecklistDisplayProps) {
    if (!checklist) {
        return <p className="text-muted-foreground text-center">No risk assessment checklist submitted for this case.</p>;
    }

    const { informationSources, humanFactors, environmentalFactors, noRiskFactors } = checklist;

    const anyHumanFactor = Object.values(humanFactors).some(value => typeof value === 'boolean' && value);
    const anyEnvironmentalFactor = Object.values(environmentalFactors).some(value => typeof value === 'boolean' && value);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Information Collected From</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-base">{informationSources.join(', ')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Human Factors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <DetailItem label="Recent history of unstable mental state" checked={humanFactors.unstableMentalState} details={humanFactors.unstableMentalStateDetails} />
                   <Separator />
                   <DetailItem label="Recent history of violence behavior" checked={humanFactors.violenceBehavior} details={humanFactors.violenceBehaviorDetails} />
                   <Separator />
                   <DetailItem label="History of sexual conviction" checked={humanFactors.sexualConviction} details={humanFactors.sexualConvictionDetails} />
                   <Separator />
                   <DetailItem label="History of drug/ alcohol/ substance abuse" checked={humanFactors.drugAbuse} details={humanFactors.drugAbuseDetails} />
                   <Separator />
                   <DetailItem label="Suspected to have infectious disease" checked={humanFactors.infectiousDisease} details={humanFactors.infectiousDiseaseDetails} />
                   <Separator />
                   <DetailItem label="Others" checked={humanFactors.humanFactorsOthers} details={humanFactors.humanFactorsOthersDetails} />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Environmental Factors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <DetailItem label="The address of patient is not clear" checked={environmentalFactors.unclearAddress} />
                   <Separator />
                   <DetailItem label="Patient's home is near the crime zone" checked={environmentalFactors.crimeZone} />
                   <Separator />
                   <DetailItem label="There has potential dangerous along the way to patient's home" checked={environmentalFactors.dangerousWay} />
                   <Separator />
                   <DetailItem label="There is mobile phone network black spots" checked={environmentalFactors.networkBlackSpots} />
                   <Separator />
                   <DetailItem label="Potential dog/ animals bite" checked={environmentalFactors.animalsBite} />
                   <Separator />
                   <DetailItem label="Predict to have severe hygiene problem" checked={environmentalFactors.severeHygiene} />
                   <Separator />
                   <DetailItem label="Others" checked={environmentalFactors.environmentalFactorsOthers} details={environmentalFactors.environmentalFactorsOthersDetails} />
                </CardContent>
            </Card>
            
            {(!anyHumanFactor && !anyEnvironmentalFactor) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Risk Confirmation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DetailItem label="No human and environmental risk factor" checked={noRiskFactors || false} />
                    </CardContent>
                </Card>
            )}

             <div>
                <p className="text-sm text-muted-foreground font-semibold">
                If there is any identified risk factor, therapist should report to supervisor prior to home visit.
                </p>
            </div>
        </div>
    );
}
