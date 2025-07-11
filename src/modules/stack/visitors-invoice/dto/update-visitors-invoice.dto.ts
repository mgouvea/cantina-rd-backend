import { PartialType } from '@nestjs/mapped-types';
import { CreateVisitorsInvoiceDto } from './create-visitors-invoice.dto';

export class UpdateVisitorsInvoiceDto extends PartialType(CreateVisitorsInvoiceDto) {}
