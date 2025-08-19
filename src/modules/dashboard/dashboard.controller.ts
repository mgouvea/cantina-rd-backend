import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { parseDateRange } from '../../shared/utils/date.utils';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('total-contents')
  findAll(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const dateRange = parseDateRange(startDate, endDate);
    return this.dashboardService.findTotalContents(dateRange);
  }

  @Get('payments-expenses')
  findExpenses() {
    return this.dashboardService.findExpenses();
  }

  @Get('group-family-open-invoices')
  findOne(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const dateRange = parseDateRange(startDate, endDate);
    return this.dashboardService.findGroupFamiliesInvoicesOpen(dateRange);
  }

  @Get('most-sold-products')
  findMostSoldProducts(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const dateRange = parseDateRange(startDate, endDate);
    return this.dashboardService.findMostSoldProducts(dateRange);
  }

  @Get('top-buyers')
  findTopBuyers(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const dateRange = parseDateRange(startDate, endDate);
    return this.dashboardService.findTopBuyers(dateRange);
  }
}
