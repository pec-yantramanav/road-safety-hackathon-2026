import { useQuery } from "@tanstack/react-query";
import { budgetApi, BudgetSchemeDetails } from "../api/services/budgetApi";

export const useBudgetController = (
  jurisdictionId: string = "central-chennai-div",
) => {
  const budgetQuery = useQuery<BudgetSchemeDetails[]>({
    queryKey: ["budgets", jurisdictionId],
    queryFn: () => budgetApi.fetchJurisdictionBudget(jurisdictionId),
    staleTime: 1000 * 60 * 10, // 10 minutes stale time
  });

  const getBudgetsSummary = () => {
    const data = budgetQuery.data || [];
    let totalSanctioned = 0;
    let totalReleased = 0;
    let totalUtilized = 0;

    data.forEach((scheme: BudgetSchemeDetails) => {
      totalSanctioned += scheme.sanctionedAmount;
      totalReleased += scheme.releasedAmount;
      totalUtilized += scheme.utilizedAmount;
    });

    return {
      totalSanctioned,
      totalReleased,
      totalUtilized,
    };
  };

  return {
    budgets: budgetQuery.data || [],
    isLoading: budgetQuery.isLoading,
    error: budgetQuery.error,
    summary: getBudgetsSummary(),
  };
};
