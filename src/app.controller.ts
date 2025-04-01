import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AudioService } from './audio.service';

@Controller('radio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get('stream')
  streamAudio(@Res() res: Response) {
    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'icy-name': 'NestJS Radio',
      'icy-genre': 'Live Stream',
      'icy-metaint': '8192',
    });

    this.audioService.getStream().pipe(res);
  }
}
