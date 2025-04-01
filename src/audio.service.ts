import { Injectable } from '@nestjs/common';
import { createReadStream, readdirSync } from 'fs';
import { join } from 'path';
import { PassThrough, Readable } from 'stream';

@Injectable()
export class AudioService {
  private musicDir = 'C:/music/test';
  private playlist: string[];
  private currentTrackIndex = 0;
  private stream: PassThrough;

  constructor() {
    this.playlist = readdirSync(this.musicDir)
      .filter((file) => file.endsWith('.mp3'))
      .sort();
    this.stream = new PassThrough();
    this.startStreaming();
  }

  private startStreaming() {
    if (this.playlist.length === 0) {
      console.error('No MP3 files found in /music folder');
      return;
    }
    this.playNextTrack();
  }

  private playNextTrack() {
    if (this.currentTrackIndex >= this.playlist.length) {
      this.currentTrackIndex = 0;
    }
    const trackPath = join(
      this.musicDir,
      this.playlist[this.currentTrackIndex],
    );
    console.log(`Now playing: ${this.playlist[this.currentTrackIndex]}`);

    const fileStream = createReadStream(trackPath);
    fileStream.pipe(this.stream, { end: false });

    fileStream.on('end', () => {
      this.currentTrackIndex++;
      this.playNextTrack();
    });
  }

  public getStream(): Readable {
    return this.stream;
  }
}
