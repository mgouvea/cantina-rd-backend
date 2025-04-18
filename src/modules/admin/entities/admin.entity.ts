import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AdminDocument = Admin & Document;

@Schema()
export class Admin {
  @Prop()
  idUser: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
