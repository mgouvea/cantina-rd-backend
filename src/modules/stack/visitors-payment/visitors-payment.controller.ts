import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VisitorsPaymentService } from './visitors-payment.service';
import {
  CreateVisitorsPaymentDto,
  UpdateVisitorsPaymentDto,
} from './dto/create-visitors-payment.dto';

@Controller('visitors-payment')
export class VisitorsPaymentController {
  constructor(
    private readonly visitorsPaymentService: VisitorsPaymentService,
  ) {}

  @Post()
  create(@Body() createVisitorsPaymentDto: CreateVisitorsPaymentDto) {
    return this.visitorsPaymentService.create(createVisitorsPaymentDto);
  }

  @Get()
  findAll() {
    return this.visitorsPaymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorsPaymentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVisitorsPaymentDto: UpdateVisitorsPaymentDto,
  ) {
    return this.visitorsPaymentService.update(id, updateVisitorsPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorsPaymentService.remove(id);
  }
}
