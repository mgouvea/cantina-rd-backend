import { Injectable } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { Model } from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  create(createOrderDto: CreateOrderDto) {
    const createdAt = new Date();

    return this.orderModel.create({
      ...createOrderDto,
      createdAt,
    });
  }

  findAll() {
    return this.orderModel.find();
  }

  findOne(id: number) {
    return this.orderModel.findById(id);
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.orderModel.findByIdAndUpdate(id, updateOrderDto);
  }

  remove(id: number) {
    return this.orderModel.findByIdAndDelete(id);
  }
}
