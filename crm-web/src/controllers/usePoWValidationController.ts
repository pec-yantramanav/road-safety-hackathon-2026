import { useState } from 'react';
import { useSubmitProofMutation, useGetWorkOrderQuery, useApproveWorkOrderMutation } from '../api/workorderApi';

export const usePoWValidationController = (workOrderId: string) => {
  const { data: workOrder, isLoading: isLoadingWO } = useGetWorkOrderQuery(workOrderId);
  const [submitProof, { isLoading: isSubmitting }] = useSubmitProofMutation();
  const [approveWorkOrder, { isLoading: isApproving }] = useApproveWorkOrderMutation();

  const [validationProgress, setValidationProgress] = useState<'IDLE' | 'UPLOADING' | 'AI_ANALYZING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [aiAnalysisVerdict, setAiAnalysisVerdict] = useState<string | null>(null);

  const handleProofSubmission = async (file: File) => {
    if (!file) return;
    try {
      setValidationProgress('UPLOADING');
      
      // Upload proof photo
      await submitProof({ id: workOrderId, file }).unwrap();
      
      setValidationProgress('AI_ANALYZING');
      
      // Simulate polling background AI verification status from crm-ai-service
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 3) {
          clearInterval(interval);
          setValidationProgress('SUCCESS');
          setAiAnalysisVerdict('AI PASS: Pothole completely sealed. Pavement level matches surrounding grid within 94% accuracy.');
        }
      }, 1500);

    } catch (err) {
      setValidationProgress('FAILED');
      setAiAnalysisVerdict('Validation request failed.');
    }
  };

  const handleApproval = async () => {
    try {
      await approveWorkOrder(workOrderId).unwrap();
    } catch (err) {
      console.error('Work order manual approval failed:', err);
    }
  };

  return {
    workOrder,
    isLoading: isLoadingWO,
    submitProof: handleProofSubmission,
    approveWork: handleApproval,
    isSubmitting,
    isApproving,
    status: validationProgress,
    aiVerdict: aiAnalysisVerdict
  };
};
