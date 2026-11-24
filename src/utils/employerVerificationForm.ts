export const employerIndustries = [
  'Agriculture',
  'Construction',
  'Construction and Real Estate',
  'Digital Marketing',
  'Education',
  'Energy and Utilities',
  'Finance',
  'Finance and Banking',
  'Government and Public Sector',
  'Healthcare',
  'Hospitality and Tourism',
  'Logistics',
  'Manufacturing',
  'Media and Entertainment',
  'Non-profit',
  'Professional Services',
  'Real Estate',
  'Retail',
  'Retail and E-commerce',
  'Technology',
  'Telecommunications',
  'Transportation and Logistics',
  'Other',
];

export const employerRegistrationTypes = [
  { value: 'BN', label: 'CAC (Nigeria) - Business Name (BN)' },
  { value: 'CAC Private Limited Company (Ltd)', label: 'CAC (Nigeria) - Private Limited Company (Ltd)' },
  { value: 'CAC Public Limited Company (PLC)', label: 'CAC (Nigeria) - Public Limited Company (PLC)' },
  { value: 'CAC Incorporated Trustees', label: 'CAC (Nigeria) - Incorporated Trustees' },
  { value: 'CAC', label: 'CAC (Nigeria) - Existing or unspecified type (legacy)' },
  { value: 'OTHER', label: 'Other registration type' },
] as const;

export type EmployerRegistrationTypeChoice = typeof employerRegistrationTypes[number]['value'];

export const getIndustryFormState = (savedIndustry: string | null | undefined) => {
  const industry = savedIndustry ?? '';
  return employerIndustries.includes(industry) && industry !== 'Other'
    ? { choice: industry, custom: '' }
    : industry
      ? { choice: 'Other', custom: industry }
      : { choice: '', custom: '' };
};

export const getRegistrationTypeFormState = (savedType: string | null | undefined) => {
  const registrationType = savedType ?? 'CAC';
  const isKnownType = employerRegistrationTypes.some(({ value }) => value === registrationType && value !== 'OTHER');
  if (isKnownType || registrationType === 'OTHER') {
    return {
      choice: registrationType as EmployerRegistrationTypeChoice,
      custom: registrationType === 'OTHER' ? registrationType : '',
    };
  }
  return { choice: 'OTHER' as const, custom: registrationType };
};

export const getIndustrySubmissionValue = (choice: string, custom: string) => (
  choice === 'Other' ? custom.trim() : choice
);

export const getRegistrationTypeSubmissionValue = (choice: EmployerRegistrationTypeChoice, custom: string) => (
  choice === 'OTHER' ? custom.trim() : choice
);

export const normalizeOptionalHttpUrl = (value: string): { value: string; error?: string } => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return { value: '' };
  if (/\s/.test(trimmedValue)) {
    return { value, error: 'Enter a valid website address without spaces.' };
  }
  if (trimmedValue.length > 500) {
    return { value, error: 'Website addresses must be 500 characters or fewer.' };
  }

  const hasHttpScheme = /^https?:\/\//i.test(trimmedValue);
  const hasOtherScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedValue);
  if (hasOtherScheme && !hasHttpScheme) {
    return { value, error: 'Use a website address that starts with http:// or https://.' };
  }

  try {
    const url = new URL(hasHttpScheme ? trimmedValue : `https://${trimmedValue}`);
    const hostLabels = url.hostname.split('.');
    const hasValidHostname = hostLabels.length > 1
      && !url.hostname.endsWith('.')
      && hostLabels.every((label) => (
        label.length > 0
        && label.length <= 63
        && /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label)
      ));
    if (!['http:', 'https:'].includes(url.protocol)
      || !hasValidHostname
      || url.username
      || url.password) {
      return { value, error: 'Enter a valid website address using a domain name.' };
    }

    const normalized = url.toString();
    return normalized.length <= 500
      ? { value: normalized }
      : { value, error: 'Website addresses must be 500 characters or fewer.' };
  } catch {
    return { value, error: 'Enter a valid website address using http:// or https://.' };
  }
};

export const getEmployerVerificationFieldErrors = (fieldErrors?: Record<string, string>) => {
  const supportedFields = new Set([
    'registrationNumber',
    'registrationType',
    'company.companyName',
    'company.companyDescription',
    'company.website',
    'company.industry',
    'company.companySize',
    'company.phoneNumber',
    'company.location',
    'company.address',
    'company.state',
    'company.country',
    'company.linkedinUrl',
    'company.twitterUrl',
    'company.facebookUrl',
  ]);
  return Object.fromEntries(
    Object.entries(fieldErrors ?? {}).filter(([field, message]) => supportedFields.has(field) && Boolean(message)),
  );
};

export const getEmployerVerificationFailureMessage = (status: number, fallback: string) => {
  if (status === 0) return "We couldn't connect to LeamJobs. Check your internet connection and try again.";
  if (status === 413) return 'Each verification document must be 10 MB or smaller.';
  if (status === 429) return 'Too many requests were made. Please wait a moment and try again.';
  if (status >= 500) return 'We could not complete your request right now. Please try again shortly.';
  return fallback;
};
