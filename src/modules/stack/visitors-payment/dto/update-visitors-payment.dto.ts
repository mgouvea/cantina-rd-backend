import { PartialType } from '@nestjs/mapped-types';
import { CreateVisitorsPaymentDto } from './create-visitors-payment.dto';

export class UpdateVisitorsPaymentDto extends PartialType(CreateVisitorsPaymentDto) {}
