import { PartialType } from '@nestjs/mapped-types';

export class CreateVisitorsInvoiceDto {
  visitorsIds: string[];
  startDate: Date;
  endDate: Date;
}

export class UpdateVisitorsInvoiceDto extends PartialType(
  CreateVisitorsInvoiceDto,
) {}
