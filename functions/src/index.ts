import * as functions from 'firebase-functions';
import { speechToTextHandler } from './speechToText';

export const speechToText = functions.https.onRequest(speechToTextHandler);

