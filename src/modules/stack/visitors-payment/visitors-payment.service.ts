import { Injectable } from '@nestjs/common';
import { CreateVisitorsPaymentDto } from './dto/create-visitors-payment.dto';
import { UpdateVisitorsPaymentDto } from './dto/update-visitors-payment.dto';

@Injectable()
export class VisitorsPaymentService {
  create(createVisitorsPaymentDto: CreateVisitorsPaymentDto) {
    return 'This action adds a new visitorsPayment';
  }

  findAll() {
    return `This action returns all visitorsPayment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} visitorsPayment`;
  }

  update(id: number, updateVisitorsPaymentDto: UpdateVisitorsPaymentDto) {
    return `This action updates a #${id} visitorsPayment`;
  }

  remove(id: number) {
    return `This action removes a #${id} visitorsPayment`;
  }
}
