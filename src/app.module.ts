import { Module } from '@nestjs/common';
import { AudioController } from './app.controller';
import { AudioService } from './audio.service';

@Module({
  imports: [],
  controllers: [AudioController],
  providers: [AudioService],
})
export class AppModule {}
