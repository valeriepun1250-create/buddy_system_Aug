
import { Timestamp } from 'firebase/firestore';

export type UserRole = 'Case Therapist' | 'Clerk' | 'Admin';

export type CaseStatus =
  | 'To be completed by clerk'
  | 'To be follow up by clerk/buddy OT'
  | 'Complete';

export interface User {
  id: string; // The user's name (document id)
  uid: string; // The user's auth uid
  name: string;
  email: string;
  role: UserRole;
  phone: string;
}

export interface UserProfile extends User {
    approved: boolean;
}

export interface RiskFactorChecklist {
  informationSources: string[];
  humanFactors: {
    unstableMentalState: boolean;
    unstableMentalStateDetails: string;
    violenceBehavior: boolean;
    violenceBehaviorDetails: string;
    sexualConviction: boolean;
    sexualConvictionDetails: string;
    drugAbuse: boolean;
    drugAbuseDetails: string;
    infectiousDisease: boolean;
    infectiousDiseaseDetails: string;
    humanFactorsOthers: boolean;
    humanFactorsOthersDetails: string;
  };
  environmentalFactors: {
    unclearAddress: boolean;
    crimeZone: boolean;
    dangerousWay: boolean;
    networkBlackSpots: boolean;
    animalsBite: boolean;
    severeHygiene: boolean;
    environmentalFactorsOthers: boolean;
    environmentalFactorsOthersDetails: string;
  };
  noRiskFactors: boolean;
}

export interface CGATIntervalVisit {
  oahName: string;
  inTime?: Date | string | Timestamp | null;
  outTime?: Date | string | Timestamp | null;
}

export interface CGATVisitUnit {
  oahName: string;
  oahPhone: string;
  patients: string[];
}

export interface Case {
  id: string;
  caseType: 'COT' | 'CGAT';
  patientOPD: string[];
  patientPhone: string[];
  oahNames?: string[];
  homeVisitDistrict?: string;
  status: CaseStatus;
  openingTherapistId: string;
  buddyTherapistId: string;
  therapistPhone: string;
  expectedArrivalTime: Date | string | Timestamp;
  responsibleClerkId?: string;
  therapistLeavingTime?: Date | string | Timestamp | null;
  caseOtCallBackWithin15MinsOfExpectedArrival?: boolean;
  caseOtDidNotCallBack?: boolean;
  clerkContactTime?: Date | string | Timestamp | null;
  clerkUpdatedExpectedArrivalTimeTime?: Date | string | Timestamp | null;
  caseOtArriveAfterOfficeHour?: boolean;
  lossOfContact?: boolean;
  reportedTo?: string | null;
  actualArrivalTime?: Date | string | Timestamp | null; 
  actualArrivalTimeOutOfOfficeHour?: Date | string | Timestamp | null;
  expectedFinishTime?: Date | string | Timestamp | null;
  caseClosingTime?: Date | string | Timestamp | null;
  createdAt: Date | Timestamp;
  riskFactorChecklist?: RiskFactorChecklist;

  didNotCallBack15Mins?: boolean;
  buddyContactTime?: Date | string | Timestamp | null;
  updatedExpectedFinishTime?: Date | string | Timestamp | null;
  buddyLossOfContact?: boolean;
  buddyReportedTo?: string | null;
  lastUpdatedById?: string;
  willOtReturnToDepartment: boolean;
  
  // CGAT specific fields
  cgatIntervals?: CGATIntervalVisit[];
  cgatVisitUnits?: CGATVisitUnit[];

  arrivalTimeOutOfOfficeHourNotifiedBuddy?: boolean;
}
