import { Module } from '@nestjs/common';
import { BucketService } from './bucket.service';

@Module({
  controllers: [],
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketModule {}
