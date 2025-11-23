"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.speechToTextHandler = void 0;
var admin = require("firebase-admin");
var speech_1 = require("@google-cloud/speech");
var busboy_1 = require("busboy");
// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    admin.initializeApp();
}
var speechClient = new speech_1.SpeechClient();
var speechToTextHandler = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, idToken, decodedToken, err_1, busboy_2, metadata_1, audioBuffer_1, audioBytes, request, response, transcript, confidence, expected, normalizedTranscript_1, isCorrect, dbRef, newRef, error_1, message;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                // Allow CORS for the client origin - in production, restrict this
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                if (req.method === 'OPTIONS') {
                    res.status(200).send('ok');
                    return [2 /*return*/];
                }
                _f.label = 1;
            case 1:
                _f.trys.push([1, 9, , 10]);
                authHeader = req.header('Authorization');
                if (!authHeader) {
                    res.status(401).json({ error: 'Unauthorized - missing Authorization header' });
                    return [2 /*return*/];
                }
                idToken = authHeader.replace('Bearer ', '');
                decodedToken = void 0;
                _f.label = 2;
            case 2:
                _f.trys.push([2, 4, , 5]);
                return [4 /*yield*/, admin.auth().verifyIdToken(idToken)];
            case 3:
                decodedToken = _f.sent();
                return [3 /*break*/, 5];
            case 4:
                err_1 = _f.sent();
                res.status(401).json({ error: 'Unauthorized - invalid token' });
                return [2 /*return*/];
            case 5:
                busboy_2 = new busboy_1["default"]({ headers: req.headers });
                metadata_1 = {};
                audioBuffer_1 = null;
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        busboy_2.on('file', function (_fieldname, file, _filename, _encoding, _mimetype) {
                            var buffers = [];
                            file.on('data', function (data) { return buffers.push(data); });
                            file.on('end', function () {
                                audioBuffer_1 = Buffer.concat(buffers);
                            });
                        });
                        busboy_2.on('field', function (name, val) {
                            try {
                                metadata_1[name] = JSON.parse(val);
                            }
                            catch (e) {
                                metadata_1[name] = val;
                            }
                        });
                        busboy_2.on('finish', resolve);
                        busboy_2.on('error', reject);
                        req.pipe(busboy_2);
                    })];
            case 6:
                _f.sent();
                if (!audioBuffer_1) {
                    res.status(400).json({ error: 'No audio file uploaded' });
                    return [2 /*return*/];
                }
                audioBytes = audioBuffer_1.toString('base64');
                request = {
                    audio: { content: audioBytes },
                    config: {
                        encoding: speech_1.protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                        sampleRateHertz: 48000,
                        languageCode: metadata_1.languageCode || 'en-US',
                        enableAutomaticPunctuation: true,
                        model: 'default'
                    }
                };
                return [4 /*yield*/, speechClient.recognize(request)];
            case 7:
                response = (_f.sent())[0];
                transcript = ((_a = response.results) === null || _a === void 0 ? void 0 : _a.map(function (r) { var _a, _b; return (_b = (_a = r.alternatives) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript; }).join(' ')) || '';
                confidence = ((_e = (_d = (_c = (_b = response.results) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.alternatives) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.confidence) || 0;
                expected = metadata_1.expectedAnswers || [];
                normalizedTranscript_1 = transcript.toLowerCase().trim();
                isCorrect = expected.some(function (ans) { return ans.toLowerCase().trim() === normalizedTranscript_1; });
                dbRef = admin.database().ref("/speechTranscripts/".concat(decodedToken.uid));
                newRef = dbRef.push();
                return [4 /*yield*/, newRef.set({
                        userId: decodedToken.uid,
                        transcript: transcript,
                        confidence: confidence,
                        isCorrect: isCorrect,
                        expected: expected,
                        metadata: metadata_1,
                        timestamp: new Date().toISOString()
                    })];
            case 8:
                _f.sent();
                res.json({ transcript: transcript, confidence: confidence, isCorrect: isCorrect });
                return [3 /*break*/, 10];
            case 9:
                error_1 = _f.sent();
                message = error_1 instanceof Error ? error_1.message : JSON.stringify(error_1);
                console.error('speechToText error', message);
                res.status(500).json({ error: message || 'Server error' });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.speechToTextHandler = speechToTextHandler;
