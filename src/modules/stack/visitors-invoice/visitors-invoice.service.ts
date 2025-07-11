import { Injectable } from '@nestjs/common';
import { CreateVisitorsInvoiceDto } from './dto/create-visitors-invoice.dto';
import { UpdateVisitorsInvoiceDto } from './dto/update-visitors-invoice.dto';

@Injectable()
export class VisitorsInvoiceService {
  create(createVisitorsInvoiceDto: CreateVisitorsInvoiceDto) {
    return 'This action adds a new visitorsInvoice';
  }

  findAll() {
    return `This action returns all visitorsInvoice`;
  }

  findOne(id: number) {
    return `This action returns a #${id} visitorsInvoice`;
  }

  update(id: number, updateVisitorsInvoiceDto: UpdateVisitorsInvoiceDto) {
    return `This action updates a #${id} visitorsInvoice`;
  }

  remove(id: number) {
    return `This action removes a #${id} visitorsInvoice`;
  }
}
