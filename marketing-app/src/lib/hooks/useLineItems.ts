import { useQuery } from '@tanstack/react-query'
import { lineItemsApi } from '../api/lineItems'

/** Fetches both proposal and proforma line items for product popularity & performance reports. */
export function useLineItems() {
  const proposalItems = useQuery({
    queryKey: ['proposal-items-all'],
    queryFn: lineItemsApi.getAllProposalItems,
  })

  const proformaItems = useQuery({
    queryKey: ['proforma-items-all'],
    queryFn: lineItemsApi.getAllProformaItems,
  })

  return {
    proposalItems,
    proformaItems,
    isLoading: proposalItems.isLoading || proformaItems.isLoading,
    isError: proposalItems.isError || proformaItems.isError,
  }
}
