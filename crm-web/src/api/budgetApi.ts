import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { BudgetSchemeDetails } from '../types';

export const budgetApi = createApi({
  reducerPath: 'budgetApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Budgets'],
  endpoints: (builder) => ({
    getBudgets: builder.query<BudgetSchemeDetails[], void>({
      query: () => '/budget',
      providesTags: [{ type: 'Budgets', id: 'LIST' }],
    }),
    getJurisdictionBudget: builder.query<BudgetSchemeDetails[], string>({
      query: (jurisdictionId) => `/budget/${jurisdictionId}`,
      providesTags: (result, error, jurisdictionId) => [{ type: 'Budgets', id: jurisdictionId }],
    })
  }),
});

export const { useGetBudgetsQuery, useGetJurisdictionBudgetQuery } = budgetApi;
