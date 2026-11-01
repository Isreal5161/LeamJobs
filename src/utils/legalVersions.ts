export const TERMS_POLICY_VERSION = '1.0';
export const PRIVACY_POLICY_VERSION = '1.0';

export const LEGAL_REGISTRATION_ACCEPTANCE = {
  termsAccepted: true,
  privacyAccepted: true,
  acceptedTermsVersion: TERMS_POLICY_VERSION,
  acceptedPrivacyVersion: PRIVACY_POLICY_VERSION,
} as const;

export type LegalDocumentKey = 'terms' | 'privacy' | 'cookies' | 'payments' | 'freelancer' | 'employer';

type LegalDocumentMetadata = {
  version: string;
  lastUpdated: string;
  status: 'approved' | 'draft';
  effectiveDate?: string;
};

export const legalDocumentMetadata: Record<LegalDocumentKey, LegalDocumentMetadata> = {
  terms: {
    version: TERMS_POLICY_VERSION,
    lastUpdated: '31 October 2026',
    status: 'approved',
  },
  privacy: {
    version: PRIVACY_POLICY_VERSION,
    lastUpdated: '31 October 2026',
    status: 'approved',
  },
  cookies: {
    version: '1.0-draft',
    lastUpdated: '31 October 2026',
    status: 'draft',
    effectiveDate: 'Pending Company and legal-counsel approval',
  },
  payments: {
    version: '1.0-draft',
    lastUpdated: '31 October 2026',
    status: 'draft',
    effectiveDate: 'Pending Company and legal-counsel approval',
  },
  freelancer: {
    version: '1.0-draft',
    lastUpdated: '31 October 2026',
    status: 'draft',
    effectiveDate: 'Pending Company and legal-counsel approval',
  },
  employer: {
    version: '1.0-draft',
    lastUpdated: '31 October 2026',
    status: 'draft',
    effectiveDate: 'Pending Company and legal-counsel approval',
  },
};
