import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrdersVisitorsService } from './orders-visitors.service';
import {
  CreateOrdersVisitorDto,
  UpdateOrdersVisitorDto,
} from './dto/create-orders-visitor.dto';

@Controller('orders-visitors')
export class OrdersVisitorsController {
  constructor(private readonly ordersVisitorsService: OrdersVisitorsService) {}

  @Post()
  create(@Body() createOrdersVisitorDto: CreateOrdersVisitorDto) {
    return this.ordersVisitorsService.create(createOrdersVisitorDto);
  }

  @Get()
  findAll() {
    return this.ordersVisitorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersVisitorsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrdersVisitorDto: UpdateOrdersVisitorDto,
  ) {
    return this.ordersVisitorsService.update(+id, updateOrdersVisitorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersVisitorsService.remove(+id);
  }
}
