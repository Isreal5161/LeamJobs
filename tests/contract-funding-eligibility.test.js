import assert from 'node:assert/strict';
import test from 'node:test';
import {
  areContractFundingTermsValid,
  canShowContractFundingAction,
  getPendingFreelanceConfirmationAction,
  hasSuccessfulContractFundingPayment,
} from '../src/utils/contractFundingEligibility.ts';

const base = {
  role: 'EMPLOYER',
  contractType: 'FREELANCE_PROJECT',
  contractStatus: 'ACTIVE',
  escrowStatus: 'UNFUNDED',
  alreadyFunded: false,
  fundingTermsValid: true,
  ownsContract: true,
};

const validFundingTerms = {
  projectAmount: '100.00',
  currency: 'USD',
  platformFeePercentage: '10.00',
  platformFeeAmount: '10.00',
  seekerEntitlement: '100.00',
  escrow: {
    grossAmount: '100.00',
    platformFeeAmount: '10.00',
    seekerNetAmount: '100.00',
    currency: 'USD',
  },
  funding: {
    projectAmount: '100.00',
    percentage: '10.00',
    feeAmount: '10.00',
    totalEmployerPayment: '110.00',
    seekerEntitlement: '100.00',
    currency: 'USD',
  },
};

test('eligible active freelance project can show secure funding when action metadata is absent', () => {
  assert.equal(canShowContractFundingAction(base), true);
  assert.equal(canShowContractFundingAction({
    ...base,
    escrowStatus: 'FUNDING',
    availableActions: { fund: undefined },
  }), true);
});

test('pending freelance API response can be funded before either party confirms', () => {
  const pendingBackendResponse = {
    type: 'FREELANCE_PROJECT',
    status: 'PENDING',
    employerId: 'employer-current-user',
    availableActions: { fund: true },
    funding: validFundingTerms.funding,
    freelance: {
      agreedAmount: '100.00',
      currency: 'USD',
      platformFeePercentage: '10.00',
      platformFeeAmount: '10.00',
      seekerNetAmount: '100.00',
      employerConfirmedAt: null,
      seekerConfirmedAt: null,
      escrow: {
        ...validFundingTerms.escrow,
        status: 'UNFUNDED',
        payments: [],
      },
    },
  };
  assert.equal(getPendingFreelanceConfirmationAction({
    role: 'EMPLOYER',
    contractType: pendingBackendResponse.type,
    contractStatus: pendingBackendResponse.status,
    employerConfirmedAt: pendingBackendResponse.freelance.employerConfirmedAt,
    seekerConfirmedAt: pendingBackendResponse.freelance.seekerConfirmedAt,
  }), 'EMPLOYER');
  assert.equal(getPendingFreelanceConfirmationAction({
    role: 'SEEKER',
    contractType: pendingBackendResponse.type,
    contractStatus: pendingBackendResponse.status,
    employerConfirmedAt: pendingBackendResponse.freelance.employerConfirmedAt,
    seekerConfirmedAt: pendingBackendResponse.freelance.seekerConfirmedAt,
  }), 'SEEKER');
  const fundingTermsValid = areContractFundingTermsValid({
    projectAmount: pendingBackendResponse.freelance.agreedAmount,
    currency: pendingBackendResponse.freelance.currency,
    platformFeePercentage: pendingBackendResponse.freelance.platformFeePercentage,
    platformFeeAmount: pendingBackendResponse.freelance.platformFeeAmount,
    seekerEntitlement: pendingBackendResponse.freelance.seekerNetAmount,
    escrow: pendingBackendResponse.freelance.escrow,
    funding: pendingBackendResponse.funding,
  });
  assert.equal(canShowContractFundingAction({
    ...base,
    contractStatus: pendingBackendResponse.status,
    availableActions: pendingBackendResponse.availableActions,
    escrowStatus: pendingBackendResponse.freelance.escrow.status,
    fundingTermsValid,
    ownsContract: pendingBackendResponse.employerId === 'employer-current-user',
  }), true);
  assert.equal(canShowContractFundingAction({
    ...base,
    contractStatus: 'PENDING',
    availableActions: { fund: true },
    escrowStatus: null,
    fundingTermsValid: false,
  }), false);
  assert.equal(getPendingFreelanceConfirmationAction({
    role: 'EMPLOYER',
    contractType: pendingBackendResponse.type,
    contractStatus: 'ACTIVE',
    employerConfirmedAt: 'confirmed',
    seekerConfirmedAt: 'confirmed',
  }), null);
});

test('active freelance contract API response with backend-approved funding terms is eligible', () => {
  const activeContractResponse = {
    type: 'FREELANCE_PROJECT',
    status: 'ACTIVE',
    employerId: 'employer-current-user',
    availableActions: { fund: true, confirmCompletion: false },
    funding: validFundingTerms.funding,
    freelance: {
      agreedAmount: '100.00',
      currency: 'USD',
      platformFeePercentage: '10.00',
      platformFeeAmount: '10.00',
      seekerNetAmount: '100.00',
      employerConfirmedAt: '2026-10-09T04:00:00.000Z',
      seekerConfirmedAt: '2026-10-09T04:01:00.000Z',
      escrow: {
        ...validFundingTerms.escrow,
        status: 'UNFUNDED',
        payments: [],
      },
    },
  };
  const fundingTermsValid = areContractFundingTermsValid({
    projectAmount: activeContractResponse.freelance.agreedAmount,
    currency: activeContractResponse.freelance.currency,
    platformFeePercentage: activeContractResponse.freelance.platformFeePercentage,
    platformFeeAmount: activeContractResponse.freelance.platformFeeAmount,
    seekerEntitlement: activeContractResponse.freelance.seekerNetAmount,
    escrow: activeContractResponse.freelance.escrow,
    funding: activeContractResponse.funding,
    existingPayment: activeContractResponse.freelance.escrow.payments[0],
  });
  assert.equal(fundingTermsValid, true);
  assert.equal(canShowContractFundingAction({
    ...base,
    contractType: activeContractResponse.type,
    contractStatus: activeContractResponse.status,
    availableActions: activeContractResponse.availableActions,
    escrowStatus: activeContractResponse.freelance.escrow.status,
    fundingTermsValid,
    ownsContract: activeContractResponse.employerId === 'employer-current-user',
  }), true);
});

test('eligible regular contract job retains its pending funding action', () => {
  assert.equal(canShowContractFundingAction({
    ...base,
    contractType: 'CONTRACT_PROJECT',
    contractStatus: 'PENDING',
    availableActions: { fund: true },
  }), true);
  assert.equal(canShowContractFundingAction({
    ...base,
    contractType: 'CONTRACT_PROJECT',
    contractStatus: 'PENDING',
  }), true);
});

test('explicit backend ineligibility suppresses funding for employers and admins', () => {
  assert.equal(canShowContractFundingAction({ ...base, availableActions: { fund: false } }), false);
  assert.equal(canShowContractFundingAction({
    ...base,
    role: 'ADMIN',
    availableActions: { fund: false },
  }), false);
  assert.equal(canShowContractFundingAction({
    ...base,
    availableActions: { fund: false },
  }), false);
  assert.equal(canShowContractFundingAction({
    ...base,
    availableActions: { fund: true },
    fundingTermsValid: false,
  }), false);
});

test('funded, missing escrow, invalid status, and unsupported types suppress funding', () => {
  assert.equal(canShowContractFundingAction({ ...base, escrowStatus: 'FUNDED' }), false);
  assert.equal(canShowContractFundingAction({ ...base, escrowStatus: null }), false);
  assert.equal(canShowContractFundingAction({ ...base, alreadyFunded: true }), false);
  assert.equal(canShowContractFundingAction({ ...base, fundingTermsValid: false }), false);
  assert.equal(canShowContractFundingAction({ ...base, ownsContract: false }), false);
  assert.equal(canShowContractFundingAction({ ...base, contractStatus: 'CANCELLED' }), false);
  assert.equal(canShowContractFundingAction({ ...base, contractType: 'UNKNOWN' }), false);
});

test('seekers cannot see the employer funding action', () => {
  assert.equal(canShowContractFundingAction({ ...base, role: 'SEEKER' }), false);
});

test('admin contract funding remains limited to the existing per-type statuses', () => {
  assert.equal(canShowContractFundingAction({ ...base, role: 'ADMIN' }), true);
  assert.equal(canShowContractFundingAction({
    ...base,
    role: 'ADMIN',
    contractType: 'CONTRACT_PROJECT',
    contractStatus: 'PENDING',
  }), true);
  assert.equal(canShowContractFundingAction({
    ...base,
    role: 'ADMIN',
    contractType: 'CONTRACT_PROJECT',
    contractStatus: 'ACTIVE',
  }), false);
});

test('funding snapshots must match exact amount, fee, entitlement, escrow, and currency rules', () => {
  assert.equal(areContractFundingTermsValid(validFundingTerms), true);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    seekerEntitlement: '90.00',
    funding: { ...validFundingTerms.funding, seekerEntitlement: '90.00', totalEmployerPayment: '100.00' },
    escrow: { ...validFundingTerms.escrow, seekerNetAmount: '90.00' },
  }), true);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    platformFeeAmount: '9.99',
  }), false);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    escrow: { ...validFundingTerms.escrow, grossAmount: '99.00' },
  }), false);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    escrow: { ...validFundingTerms.escrow, currency: 'EUR' },
  }), false);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    funding: { ...validFundingTerms.funding, totalEmployerPayment: '100.00' },
  }), false);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    projectAmount: '10000000000.00',
    escrow: { ...validFundingTerms.escrow, grossAmount: '10000000000.00' },
    funding: { ...validFundingTerms.funding, projectAmount: '10000000000.00', totalEmployerPayment: '10000000010.00' },
  }), false);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    projectAmount: '10.05',
    platformFeeAmount: '1.01',
    seekerEntitlement: '10.05',
    escrow: {
      grossAmount: '10.05',
      platformFeeAmount: '1.01',
      seekerNetAmount: '10.05',
      currency: 'USD',
    },
    funding: {
      projectAmount: '10.05',
      percentage: '10.00',
      feeAmount: '1.01',
      totalEmployerPayment: '11.06',
      seekerEntitlement: '10.05',
      currency: 'USD',
    },
  }), true);
});

test('missing or malformed amount and currency data fails closed', () => {
  assert.equal(areContractFundingTermsValid({ ...validFundingTerms, projectAmount: null }), false);
  assert.equal(areContractFundingTermsValid({ ...validFundingTerms, platformFeePercentage: null }), false);
  assert.equal(areContractFundingTermsValid({ ...validFundingTerms, platformFeeAmount: '-1.00' }), false);
  assert.equal(areContractFundingTermsValid({ ...validFundingTerms, currency: 'usd' }), false);
  assert.equal(areContractFundingTermsValid({ ...validFundingTerms, escrow: null }), false);
});

test('existing active payment must match the validated amount, currency, and type', () => {
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    existingPayment: { amount: '110.00', currency: 'USD', status: 'PENDING', paymentType: 'CONTRACT_FUNDING' },
  }), true);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    existingPayment: { amount: '111.00', currency: 'USD', status: 'PROCESSING', paymentType: 'CONTRACT_FUNDING' },
  }), false);
  assert.equal(areContractFundingTermsValid({
    ...validFundingTerms,
    existingPayment: { amount: '110.00', currency: 'EUR', status: 'PENDING', paymentType: 'CONTRACT_FUNDING' },
  }), false);
});

test('successful contract funding payment counts as already funded', () => {
  const successfulFunding = hasSuccessfulContractFundingPayment([
    { paymentType: 'CONTRACT_FUNDING', status: 'SUCCESSFUL' },
  ]);
  assert.equal(successfulFunding, true);
  assert.equal(canShowContractFundingAction({ ...base, alreadyFunded: successfulFunding }), false);
  assert.equal(hasSuccessfulContractFundingPayment([
    { paymentType: 'SUBSCRIPTION', status: 'SUCCESSFUL' },
  ]), false);
});
