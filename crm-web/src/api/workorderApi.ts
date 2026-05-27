import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { WorkOrder } from '../types';

export const workorderApi = createApi({
  reducerPath: 'workorderApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkOrders'],
  endpoints: (builder) => ({
    getWorkOrders: builder.query<WorkOrder[], void>({
      query: () => '/workorders',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'WorkOrders' as const, id })), { type: 'WorkOrders', id: 'LIST' }]
          : [{ type: 'WorkOrders', id: 'LIST' }],
    }),
    getWorkOrder: builder.query<WorkOrder, string>({
      query: (id) => `/workorders/${id}`,
      providesTags: (result, error, id) => [{ type: 'WorkOrders', id }],
    }),
    createWorkOrder: builder.mutation<WorkOrder, Partial<WorkOrder>>({
      query: (body) => ({
        url: '/workorders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'WorkOrders', id: 'LIST' }],
    }),
    submitProof: builder.mutation<WorkOrder, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/workorders/${id}/submit`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' }
      ],
    }),
    approveWorkOrder: builder.mutation<WorkOrder, string>({
      query: (id) => ({
        url: `/workorders/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'WorkOrders', id },
        { type: 'WorkOrders', id: 'LIST' }
      ],
    })
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderQuery,
  useCreateWorkOrderMutation,
  useSubmitProofMutation,
  useApproveWorkOrderMutation
} = workorderApi;
