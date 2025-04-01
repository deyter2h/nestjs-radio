import { Injectable } from '@nestjs/common';
import { createReadStream, readdirSync } from 'fs';
import * as path from 'path';
import { PassThrough, Readable } from 'stream';
import { parseFile } from 'music-metadata';

import { TrackInfo } from './structs/track.info';

@Injectable()
export class AudioService {
  private tracksMeta: TrackInfo[] = [];
  private currentTrackIndex = 0;
  private stream: PassThrough;
  private trackStartTime: number = Date.now();
  private activeClients: Set<PassThrough> = new Set();

  constructor() {
    this.scanDir('C:/music/test');
  }

  private async scanDir(musicDir: string): Promise<void> {
    const paths: string[] = readdirSync(musicDir)
      .filter((file) => file.endsWith('.mp3'))
      .map((e) => path.join(musicDir, e));

    if (!paths.length) {
      console.error('No MP3 files found');
      return;
    }

    console.log('Found files:', paths);

    for (const trackPath of paths) {
      const meta = await parseFile(trackPath);
      this.tracksMeta.push({
        filePath: trackPath,
        name: path.basename(trackPath),
        duration: meta.format.duration,
        bitrate: meta.format.bitrate,
      });
    }

    if (this.tracksMeta.length > 0) {
      this.stream = new PassThrough();
      this.playNextTrack();
    }
  }

  private playNextTrack() {
    if (this.currentTrackIndex >= this.tracksMeta.length) {
      this.currentTrackIndex = 0;
    }

    const currentTrack = this.tracksMeta[this.currentTrackIndex];
    this.trackStartTime = Date.now();

    console.log(`Now playing: ${currentTrack.name}`);

    this.stream = new PassThrough();
    const fileStream = createReadStream(currentTrack.filePath);

    fileStream.pipe(this.stream);

    fileStream.on('end', () => {
      this.currentTrackIndex++;
      this.playNextTrack();
    });

    fileStream.on('error', (err) => {
      console.error('Error reading file:', err);
      this.currentTrackIndex++;
      this.playNextTrack();
    });

    this.activeClients.forEach((client) => {
      this.stream.pipe(client, { end: false });
    });
  }

  private getCurrentTrackPosition(): number {
    return Math.floor((Date.now() - this.trackStartTime) / 1000);
  }

  public getStream(): Readable {
    const clientStream = new PassThrough();
    this.activeClients.add(clientStream);

    if (this.tracksMeta.length === 0) {
      console.error('No tracks available');
      return clientStream;
    }

    const currentTrack = this.tracksMeta[this.currentTrackIndex];
    const offset = this.getCurrentTrackPosition();

    console.log(
      `New client joined. Syncing at ${offset} sec of ${currentTrack.name}`,
    );

    const fileStream = createReadStream(currentTrack.filePath, {
      start: Math.floor((offset * currentTrack.bitrate) / 8), // Calculate byte offset
    });

    fileStream.pipe(clientStream, { end: false });

    fileStream.on('end', () => {
      console.log('Client stream ended');
    });

    // Remove client when they disconnect
    clientStream.on('close', () => {
      this.activeClients.delete(clientStream);
    });

    return clientStream;
  }
}
