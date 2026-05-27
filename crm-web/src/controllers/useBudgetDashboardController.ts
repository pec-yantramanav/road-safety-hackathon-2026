import { useGetBudgetsQuery, useGetJurisdictionBudgetQuery } from '../api/budgetApi';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { useMemo } from 'react';

export const useBudgetDashboardController = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Fetch either master list or jurisdiction scoped budget
  const { data: budgets = [], isLoading, error } = useGetJurisdictionBudgetQuery(
    currentUser?.jurisdiction_id || 'ward-42-id'
  );

  const budgetSummary = useMemo(() => {
    let totalSanctioned = 0;
    let totalReleased = 0;
    let totalUtilized = 0;

    budgets.forEach((item) => {
      totalSanctioned += item.sanctionedAmount;
      totalReleased += item.releasedAmount;
      totalUtilized += item.utilizedAmount;
    });

    const percentUtilized = totalReleased > 0 ? (totalUtilized / totalReleased) * 100 : 0;

    return {
      totalSanctioned,
      totalReleased,
      totalUtilized,
      percentUtilized: Number(percentUtilized.toFixed(1)),
    };
  }, [budgets]);

  return {
    budgets,
    isLoading,
    error,
    summary: budgetSummary
  };
};
