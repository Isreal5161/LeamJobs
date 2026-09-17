export type UserFacingErrorContext = 'default' | 'upload' | 'payment' | 'auth' | 'job' | 'timeout';

type ErrorDetails = unknown;

type NormalizeErrorInput = {
  status?: number;
  message?: string | null;
  code?: string | null;
  details?: ErrorDetails;
  context?: UserFacingErrorContext;
};

const technicalMessagePattern = /(failed to fetch|network error|network request|prisma|sql|database|stack trace|\bat\s+\w+\s+\(|internal server|endpoint|api\/?|axios|fetch\(|timeout|timed out|econn|enotfound|socket|syntaxerror|typeerror)/i;
const safeBusinessMessagePattern = /(already applied|already closed|already exists|insufficient|exceeds|balance|not enough|invalid|expired|does not match|cannot be|can't|must be|is required|is unavailable|not available|not found|permission|unauthorized|forbidden|withdrawal amount|pending invitation)/i;
const safeVerificationMessages = new Set([
  'Your company verification is already under review.',
  'Your company is already verified.',
  'Your company verification was declined. Please review the reason and resubmit.',
  'Company verification is required before you can post a job.',
  'Your company verification is currently under review.',
  'Complete your company profile before submitting verification',
  'CAC, BN, or business registration number is required',
  'A valid registration type is required',
  'A valid verification document type is required',
  'A document file is required',
  'Verification documents must be 10 MB or smaller',
  'The uploaded document is empty',
  'Unsupported document type. Please upload a PDF, JPG, PNG, or WEBP image.',
  'The uploaded file name is invalid',
  'Documents cannot be changed while verification is being reviewed.',
  'Your verification changed while it was being submitted. Please review the current status and try again.',
  'This verification document could not be saved because it was submitted more than once.',
  'This verification has not been submitted for review.',
  'This verification was already reviewed.',
]);

const contextForEndpoint = (endpoint: string): UserFacingErrorContext => {
  const normalized = endpoint.toLowerCase();
  if (normalized.includes('upload') || normalized.includes('/logo') || normalized.includes('/resume') || normalized.includes('/cv')) return 'upload';
  if (normalized.includes('payment') || normalized.includes('withdraw') || normalized.includes('escrow') || normalized.includes('subscription')) return 'payment';
  if (normalized.includes('/auth')) return 'auth';
  if (normalized.includes('/job')) return 'job';
  return 'default';
};

const fallbackFor = (context: UserFacingErrorContext) => {
  if (context === 'upload') return "We couldn't upload your file. Please try again.";
  if (context === 'payment') return "We couldn't complete the payment. Please try again.";
  if (context === 'auth') return 'Your session has expired. Please sign in again.';
  if (context === 'job') return "We couldn't load the job right now. Please try again.";
  return 'Something went wrong. Please try again.';
};

const isSafeMessage = (message: string) => {
  const normalized = message.trim();
  return normalized.length > 0
    && normalized.length <= 240
    && !technicalMessagePattern.test(normalized)
    && (safeBusinessMessagePattern.test(normalized) || safeVerificationMessages.has(normalized));
};

const safeFieldErrors = (details: unknown) => {
  if (!Array.isArray(details)) return undefined;

  const entries = details.reduce<Record<string, string>>((result, detail) => {
    if (!detail || typeof detail !== 'object') return result;
    const field = 'field' in detail ? String(detail.field ?? '').trim() : '';
    const message = 'message' in detail ? String(detail.message ?? '').trim() : '';
    if (field && isSafeMessage(message)) result[field] = message;
    return result;
  }, {});

  return Object.keys(entries).length > 0 ? entries : undefined;
};

export const normalizeApiError = ({ status = 0, message, code, details, context = 'default' }: NormalizeErrorInput) => {
  const rawMessage = String(message ?? '').trim();
  const fieldErrors = safeFieldErrors(details);
  const effectiveContext = context;

  if (status === 0 || /failed to fetch|network error|network request|econn|enotfound|socket/i.test(rawMessage)) {
    return { message: "We couldn't connect to LeamJobs. Please check your internet connection and try again.", code: code ?? 'NETWORK_ERROR', fieldErrors };
  }

  if (status === 401) return { message: 'Your session has expired. Please sign in again.', code: code ?? 'UNAUTHORIZED', fieldErrors };
  if (['ROLE_MISMATCH', 'EMPLOYER_NOT_VERIFIED', 'VERIFICATION_STATE_CONFLICT'].includes(String(code)) && isSafeMessage(rawMessage)) {
    return { message: rawMessage, code: code ?? 'FORBIDDEN', fieldErrors };
  }
  if (status === 403) return { message: "You don't have permission to perform this action.", code: code ?? 'FORBIDDEN', fieldErrors };
  if (status === 404) return { message: "We couldn't find what you're looking for.", code: code ?? 'NOT_FOUND', fieldErrors };
  if (status === 408 || /timed out|timeout/i.test(rawMessage)) return { message: 'The request took too long to complete. Please try again.', code: code ?? 'TIMEOUT', fieldErrors };

  if (status === 422) {
    return { message: fieldErrors ? 'Please check the information you entered and try again.' : (isSafeMessage(rawMessage) ? rawMessage : 'Please check the information you entered and try again.'), code: code ?? 'VALIDATION_ERROR', fieldErrors };
  }

  if (isSafeMessage(rawMessage)) return { message: rawMessage, code: code ?? 'BUSINESS_ERROR', fieldErrors };
  if (rawMessage && !technicalMessagePattern.test(rawMessage) && /couldn't|could not|please|session|something went wrong|try again|unable|unavailable/i.test(rawMessage)) {
    return { message: rawMessage, code: code ?? 'SAFE_ERROR', fieldErrors };
  }
  if (status >= 500) return { message: 'Something went wrong on our side. Please try again shortly.', code: code ?? 'SERVER_ERROR', fieldErrors };
  return { message: fallbackFor(effectiveContext), code: code ?? 'UNKNOWN_ERROR', fieldErrors };
};

export const getUserFacingError = (error: unknown, context: UserFacingErrorContext = 'default') => normalizeApiError({
  status: error instanceof Error && /failed to fetch|network error|network request|econn|enotfound|socket/i.test(error.message) ? 0 : 500,
  message: error instanceof Error ? error.message : String(error ?? ''),
  context,
});

export const errorContextForEndpoint = contextForEndpoint;
