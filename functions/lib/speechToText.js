"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechToTextHandler = void 0;
const admin = __importStar(require("firebase-admin"));
const speech_1 = require("@google-cloud/speech");
const busboy_1 = __importDefault(require("busboy"));
const stream_1 = require("stream");
// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}
const speechClient = new speech_1.SpeechClient();
const speechToTextHandler = async (req, res) => {
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
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        }
        catch (err) {
            res.status(401).json({ error: 'Unauthorized - invalid token' });
            return;
        }
        // Prefer JSON body with base64 audio: { audio: "...", metadata: {...} }
        let audioBase64;
        let metadata = {};
        if (req.is('application/json') && req.body && req.body.audio) {
            console.log('Received JSON audio payload');
            audioBase64 = req.body.audio;
            metadata = req.body.metadata || {};
        }
        else {
            // Fall back to multipart/form-data parsing
            console.log('Falling back to multipart parsing');
            // Debug log headers
            const contentType = req.headers['content-type'] || req.headers['Content-Type'];
            const contentLength = req.headers['content-length'] || req.headers['Content-Length'];
            console.log('speechToText incoming headers:', { contentType, contentLength, rawBodyLength: req.rawBody ? req.rawBody.length : undefined });
            const BusboyAny = busboy_1.default;
            const busboy = BusboyAny({ headers: req.headers });
            let audioBuffer = null;
            await new Promise((resolve, reject) => {
                busboy.on('file', (_fieldname, file) => {
                    const buffers = [];
                    file.on('data', (data) => buffers.push(data));
                    file.on('end', () => {
                        audioBuffer = Buffer.concat(buffers);
                    });
                });
                busboy.on('field', (name, val) => {
                    try {
                        metadata[name] = JSON.parse(val);
                    }
                    catch (e) {
                        metadata[name] = val;
                    }
                });
                busboy.on('finish', resolve);
                busboy.on('error', (err) => {
                    console.error('busboy error', err.message);
                    reject(err);
                });
                const raw = req.rawBody;
                if (raw && raw.length > 0) {
                    const stream = new stream_1.Readable();
                    stream.push(raw);
                    stream.push(null);
                    stream.pipe(busboy);
                }
                else {
                    req.pipe(busboy);
                }
            });
            if (!audioBuffer) {
                throw new Error('No audio file uploaded');
            }
            audioBase64 = audioBuffer.toString('base64');
        }
        if (!audioBase64) {
            res.status(400).json({ error: 'No audio payload found' });
            return;
        }
        // At this point we have audioBase64 and metadata
        const audioBytes = audioBase64;
        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: speech_1.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sampleRateHertz: 48000,
                languageCode: metadata.languageCode || 'en-US',
                enableAutomaticPunctuation: true,
                model: 'default',
            },
        };
        const [response] = await speechClient.recognize(request);
        const transcript = response.results?.map((r) => r.alternatives?.[0]?.transcript).join(' ') || '';
        const confidence = response.results?.[0]?.alternatives?.[0]?.confidence || 0;
        // Simple evaluation against expected answers from metadata
        const expected = metadata.expectedAnswers || [];
        const normalizedTranscript = transcript.toLowerCase().trim();
        const isCorrect = expected.some((ans) => ans.toLowerCase().trim() === normalizedTranscript);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        console.error('speechToText error', message);
        res.status(500).json({ error: message || 'Server error' });
    }
};
exports.speechToTextHandler = speechToTextHandler;
