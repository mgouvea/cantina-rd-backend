import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VisitorDocument = Visitor & Document;

@Schema()
export class Visitor {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  telephone: string;

  @Prop({ required: false })
  churchCore?: string; // núcleo

  @Prop({ default: 1, required: false })
  visitCount: number;

  @Prop({ default: () => new Date(), required: false })
  lastVisit: Date;
}

export const VisitorSchema = SchemaFactory.createForClass(Visitor);
