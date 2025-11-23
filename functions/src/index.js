"use strict";
exports.__esModule = true;
exports.speechToText = void 0;
var functions = require("firebase-functions");
var speechToText_1 = require("./speechToText");
exports.speechToText = functions.https.onRequest(speechToText_1.speechToTextHandler);
