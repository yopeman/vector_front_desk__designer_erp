import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { syncPurchasesFromStore, syncSalesFromFrontdesk, syncPayrollFromHR } from '../services/syncService';

export function useSyncPurchases() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: syncPurchasesFromStore,
    onSuccess: (result) => {
      toast.success(`Synced ${result.success} purchases successfully`);
      if (result.failed > 0) {
        toast.error(`${result.failed} purchases failed to sync`);
      }
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

export function useSyncSales() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: syncSalesFromFrontdesk,
    onSuccess: (result) => {
      toast.success(`Synced ${result.success} sales successfully`);
      if (result.failed > 0) {
        toast.error(`${result.failed} sales failed to sync`);
      }
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

export function useSyncPayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => 
      syncPayrollFromHR(year, month),
    onSuccess: (result) => {
      toast.success(`Generated payroll for ${result.success} employees successfully`);
      if (result.failed > 0) {
        toast.error(`${result.failed} employees failed to process`);
      }
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (error) => {
      toast.error(`Payroll generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
