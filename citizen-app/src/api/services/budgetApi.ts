import { apiClient, USE_MOCK } from '../client/apiClient';

export interface BudgetSchemeDetails {
  schemeName: string;
  sanctionedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  financialYear: string;
  authorityType: string;
}

export const budgetApi = {
  fetchJurisdictionBudget: async (jurisdictionId: string): Promise<BudgetSchemeDetails[]> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [
        {
          schemeName: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
          sanctionedAmount: 50000000,
          releasedAmount: 40000000,
          utilizedAmount: 32000000,
          financialYear: '2025-2026',
          authorityType: 'PMGSY'
        },
        {
          schemeName: 'Smart Cities Road Infrastructure Extension',
          sanctionedAmount: 75000000,
          releasedAmount: 60000000,
          utilizedAmount: 55000000,
          financialYear: '2025-2026',
          authorityType: 'MUNICIPAL'
        }
      ];
    }
    const response = await apiClient.get<BudgetSchemeDetails[]>(`/budget/${jurisdictionId}`);
    return response.data;
  }
};
