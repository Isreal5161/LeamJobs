export type ContractFundingEligibilityInput = {
  role: 'EMPLOYER' | 'ADMIN' | 'SEEKER';
  contractType: string;
  contractStatus: string;
  availableActions?: { fund?: boolean } | null;
  escrowStatus?: string | null;
  alreadyFunded: boolean;
  fundingTermsValid: boolean;
  ownsContract: boolean;
};

export type ContractConfirmationRole = 'EMPLOYER' | 'SEEKER' | 'ADMIN';

export function getPendingFreelanceConfirmationAction({
  role,
  contractType,
  contractStatus,
  employerConfirmedAt,
  seekerConfirmedAt,
}: {
  role: ContractConfirmationRole;
  contractType: string;
  contractStatus: string;
  employerConfirmedAt?: string | null;
  seekerConfirmedAt?: string | null;
}): 'EMPLOYER' | 'SEEKER' | null {
  if (contractType !== 'FREELANCE_PROJECT' || contractStatus !== 'PENDING') return null;
  if (role === 'EMPLOYER' && !employerConfirmedAt) return 'EMPLOYER';
  if (role === 'SEEKER' && !seekerConfirmedAt) return 'SEEKER';
  return null;
}

type FundingTermsValidationInput = {
  projectAmount?: string | number | null;
  currency?: string | null;
  platformFeePercentage?: string | number | null;
  platformFeeAmount?: string | number | null;
  seekerEntitlement?: string | number | null;
  escrow?: {
    grossAmount?: string | number | null;
    platformFeeAmount?: string | number | null;
    seekerNetAmount?: string | number | null;
    currency?: string | null;
  } | null;
  funding?: {
    projectAmount?: string | number | null;
    percentage?: string | number | null;
    feeAmount?: string | number | null;
    totalEmployerPayment?: string | number | null;
    seekerEntitlement?: string | number | null;
    currency?: string | null;
  } | null;
  existingPayment?: {
    amount?: string | number | null;
    currency?: string | null;
    status?: string | null;
    paymentType?: string | null;
  } | null;
};

export function hasSuccessfulContractFundingPayment(
  payments: Array<{ paymentType?: string | null; status?: string | null }> | null | undefined,
): boolean {
  return Boolean(payments?.some(
    (payment) => payment.paymentType === 'CONTRACT_FUNDING' && payment.status === 'SUCCESSFUL',
  ));
}

const toMinorUnits = (value: string | number | null | undefined): bigint | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const toPercentageHundredths = (value: string | number | null | undefined): bigint | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

export function areContractFundingTermsValid({
  projectAmount,
  currency,
  platformFeePercentage,
  platformFeeAmount,
  seekerEntitlement,
  escrow,
  funding,
  existingPayment,
}: FundingTermsValidationInput): boolean {
  const projectMinor = toMinorUnits(projectAmount);
  const feeMinor = toMinorUnits(platformFeeAmount);
  const seekerMinor = toMinorUnits(seekerEntitlement);
  const percentageHundredths = toPercentageHundredths(platformFeePercentage);
  const escrowGrossMinor = toMinorUnits(escrow?.grossAmount);
  const escrowFeeMinor = toMinorUnits(escrow?.platformFeeAmount);
  const escrowSeekerMinor = toMinorUnits(escrow?.seekerNetAmount);

  if (projectMinor === null || projectMinor <= 0n
    || feeMinor === null || seekerMinor === null
    || percentageHundredths === null || percentageHundredths > 10000n
    || !/^[A-Z]{3}$/.test(currency ?? '')
    || escrowGrossMinor === null || escrowFeeMinor === null || escrowSeekerMinor === null
    || escrow?.currency !== currency) return false;

  const expectedFeeMinor = (projectMinor * percentageHundredths + 5000n) / 10000n;
  if (feeMinor !== expectedFeeMinor || escrowGrossMinor !== projectMinor
    || escrowFeeMinor !== feeMinor || escrowSeekerMinor !== seekerMinor) return false;

  const isAdditive = seekerMinor === projectMinor;
  if (!isAdditive && seekerMinor !== projectMinor - feeMinor) return false;
  const expectedTotalMinor = isAdditive ? projectMinor + feeMinor : projectMinor;
  if (expectedTotalMinor > 999999999999n) return false;

  if (funding && (
    toMinorUnits(funding.projectAmount) !== projectMinor
    || toPercentageHundredths(funding.percentage) !== percentageHundredths
    || toMinorUnits(funding.feeAmount) !== feeMinor
    || toMinorUnits(funding.totalEmployerPayment) !== expectedTotalMinor
    || toMinorUnits(funding.seekerEntitlement) !== seekerMinor
    || funding.currency !== currency
  )) return false;

  if (existingPayment && ['PENDING', 'PROCESSING', 'SUCCESSFUL'].includes(existingPayment.status ?? '')
    && (toMinorUnits(existingPayment.amount) !== expectedTotalMinor
      || existingPayment.currency !== currency
      || existingPayment.paymentType !== 'CONTRACT_FUNDING')) return false;

  return true;
}

export function canShowContractFundingAction({
  role,
  contractType,
  contractStatus,
  availableActions,
  escrowStatus,
  alreadyFunded,
  fundingTermsValid,
  ownsContract,
}: ContractFundingEligibilityInput): boolean {
  if (!ownsContract || !fundingTermsValid || alreadyFunded
    || !['UNFUNDED', 'FUNDING'].includes(escrowStatus ?? '')
    || availableActions?.fund === false) return false;

  const isContractJob = contractType === 'CONTRACT_PROJECT';
  const isFreelanceProject = contractType === 'FREELANCE_PROJECT';
  if (!isContractJob && !isFreelanceProject) return false;

  if (role === 'SEEKER') return false;
  if (isContractJob) return contractStatus === 'PENDING';
  return ['PENDING', 'ACTIVE'].includes(contractStatus);
}
