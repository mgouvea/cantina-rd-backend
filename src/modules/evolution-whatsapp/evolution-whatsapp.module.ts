import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EvolutionWhatsappService } from './evolution-whatsapp.service';
import { EvolutionWhatsappController } from './evolution-whatsapp.controller';

@Module({
  imports: [HttpModule],
  controllers: [EvolutionWhatsappController],
  providers: [EvolutionWhatsappService],
  exports: [EvolutionWhatsappService],
})
export class EvolutionWhatsappModule {}
