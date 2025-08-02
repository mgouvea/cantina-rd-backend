export class FetchMultipleVisitorsInvoicesDto {
  ids: string[];
  isArchivedInvoice: 'true' | 'false' | 'all';
}
