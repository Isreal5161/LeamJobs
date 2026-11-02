import type { ContractData } from '../services/api';

export const canDeleteEmployerContract = (contract: Pick<ContractData, 'availableActions'>) => (
  contract.availableActions?.delete === true
);
