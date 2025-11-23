import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { SpeechClient, protos } from '@google-cloud/speech';
import Busboy from 'busboy';
import { Readable } from 'stream';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const speechClient = new SpeechClient();

export const speechToTextHandler = async (req: Request, res: Response) => {
  // Allow CORS for the client origin - in production, restrict this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('ok');
    return;
  }

  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized - missing Authorization header' });
      return;
    }

    const idToken = authHeader.replace('Bearer ', '');
    // Verify Firebase ID token
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized - invalid token' });
      return;
    }

    // Prefer JSON body with base64 audio: { audio: "...", metadata: {...} }
    let audioBase64: string | undefined;
    let metadata: Record<string, unknown> = {};

    if (req.is('application/json') && req.body && (req.body as any).audio) {
      console.log('Received JSON audio payload');
      audioBase64 = (req.body as any).audio;
      metadata = (req.body as any).metadata || {};
    } else {
      // Fall back to multipart/form-data parsing
      console.log('Falling back to multipart parsing');

      // Debug log headers
      const contentType = req.headers['content-type'] || req.headers['Content-Type'];
      const contentLength = req.headers['content-length'] || req.headers['Content-Length'];
      console.log('speechToText incoming headers:', { contentType, contentLength, rawBodyLength: (req as any).rawBody ? (req as any).rawBody.length : undefined });

      const BusboyAny: any = Busboy;
      const busboy: any = BusboyAny({ headers: req.headers });
      let audioBuffer: Buffer | null = null;

      await new Promise<void>((resolve, reject) => {
        busboy.on('file', (_fieldname: string, file: any) => {
          const buffers: Buffer[] = [];
          file.on('data', (data: Buffer) => buffers.push(data));
          file.on('end', () => {
            audioBuffer = Buffer.concat(buffers);
          });
        });

        busboy.on('field', (name: string, val: string) => {
          try {
            metadata[name] = JSON.parse(val);
          } catch (e) {
            metadata[name] = val;
          }
        });

        busboy.on('finish', resolve);
        busboy.on('error', (err: Error) => {
          console.error('busboy error', err.message);
          reject(err);
        });

        const raw: Buffer | undefined = (req as any).rawBody;
        if (raw && raw.length > 0) {
          const stream = new Readable();
          stream.push(raw);
          stream.push(null);
          stream.pipe(busboy);
        } else {
          (req as any).pipe(busboy);
        }
      });

      if (!audioBuffer) {
        throw new Error('No audio file uploaded');
      }

      audioBase64 = (audioBuffer as Buffer).toString('base64');
    }

    if (!audioBase64) {
      res.status(400).json({ error: 'No audio payload found' });
      return;
    }

    // At this point we have audioBase64 and metadata
    const audioBytes = audioBase64;

    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: { content: audioBytes },
      config: {
        encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sampleRateHertz: 48000,
        languageCode: (metadata.languageCode as string) || 'en-US',
        enableAutomaticPunctuation: true,
        model: 'default',
      } as protos.google.cloud.speech.v1.IRecognitionConfig,
    };

    const [response] = await speechClient.recognize(request);

    const transcript = response.results?.map((r) => r.alternatives?.[0]?.transcript).join(' ') || '';
    const confidence = response.results?.[0]?.alternatives?.[0]?.confidence || 0;

    // Simple evaluation against expected answers from metadata
    const expected = (metadata.expectedAnswers as string[]) || [];
    const normalizedTranscript = transcript.toLowerCase().trim();
    const isCorrect = expected.some((ans: string) => ans.toLowerCase().trim() === normalizedTranscript);

    // Store result in Realtime Database under /speechTranscripts/{userId}/
    const dbRef = admin.database().ref(`/speechTranscripts/${decodedToken.uid}`);
    const newRef = dbRef.push();
    await newRef.set({
      userId: decodedToken.uid,
      transcript,
      confidence,
      isCorrect,
      expected,
      metadata,
      timestamp: new Date().toISOString(),
    });

    res.json({ transcript, confidence, isCorrect });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('speechToText error', message);
    res.status(500).json({ error: message || 'Server error' });
  }
};
