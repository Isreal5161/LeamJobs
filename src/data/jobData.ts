export type ModerationStatus = 'Pending' | 'Approved' | 'Flagged' | 'Declined' | 'Draft';

export type JobDetails = {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  company: string;
};

export type PublicJob = {
  id: string;
  company: string;
  logoText: string;
  logoClass?: string;
  featured?: boolean;
  role: string;
  salary: string;
  compensationType?: 'Monthly salary' | 'One-time payment';
  paymentAmount?: number;
  location: string;
  workArrangement: string;
  workType: string;
  level: string;
  cvRequirement?: 'required' | 'recommended' | 'optional' | 'not-needed';
  description: string;
  postedAt: number;
  salaryHigh: number;
  applicants: number;
  views: number;
  conversion: string;
  expires: string;
  status: ModerationStatus;
  details: JobDetails;
};
