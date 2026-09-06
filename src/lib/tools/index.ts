import * as developer from './developer';
import * as security from './security';
import * as text from './text';
import * as fileImage from './file-image';
import * as data from './data';
import * as productivity from './productivity';

export const jsonFormatter = developer.jsonFormatter;
export const jsonMinifier = developer.jsonMinifier;
export const jsonValidator = developer.jsonValidator;
export const jsonToCsv = developer.jsonToCsv;
export const uuidGenerator = developer.uuidGenerator;
export const base64Encoder = developer.base64Encoder;
export const base64Decoder = developer.base64Decoder;
export const urlEncoder = developer.urlEncoder;
export const urlDecoder = developer.urlDecoder;
export const htmlEntitiesEncoder = developer.htmlEntitiesEncoder;
export const sha256Hash = security.sha256Hash;
export const md5Hash = security.md5Hash;
export const randomString = security.randomString;
export const passwordStrength = security.passwordStrength;
export const randomNumber = security.randomNumber;
export const randomColor = security.randomColor;
export const stringCaseConverter = text.stringCaseConverter;
export const stringReverse = text.stringReverse;
export const stringTrimmer = text.stringTrimmer;
export const stringAnalyzer = text.stringAnalyzer;
export const textToAscii = text.textToAscii;
export const asciiToText = text.asciiToText;
export const textEntropy = text.textEntropy;
export const textToSentenceCase = text.textToSentenceCase;
export const wordCounter = text.wordCounter;
export const lineCounter = text.lineCounter;
export const duplicateRemover = text.duplicateRemover;
export const textDiff = text.textDiff;
export const imageResizer = fileImage.imageResizer;
export const imageToBase64 = fileImage.imageToBase64;
export const base64ToImage = fileImage.base64ToImage;
export const pdfTextExtractor = fileImage.pdfTextExtractor;
export const imageCompressor = fileImage.imageCompressor;
export const fileSizeCalculator = fileImage.fileSizeCalculator;
export const mimeTypeDetector = fileImage.mimeTypeDetector;
export const fileNamer = fileImage.fileNamer;
export const imageCropper = fileImage.imageCropper;
export const imageRotator = fileImage.imageRotator;
export const csvToJson = data.csvToJson;
export const jsonToXml = data.jsonToXml;
export const timer = productivity.timer;
export const stopwatch = productivity.stopwatch;
export const markdownToHtml = productivity.markdownToHtml;
export const htmlToMarkdown = productivity.htmlToMarkdown;
export const dateFormatter = productivity.dateFormatter;
export const timeZoneConverter = productivity.timeZoneConverter;
export const unixTimestampConverter = productivity.unixTimestampConverter;
export const qrCodeGenerator = productivity.qrCodeGenerator;
export const barcodeGenerator = productivity.barcodeGenerator;
export const colorConverter = productivity.colorConverter;
export const unitConverter = productivity.unitConverter;

export const TOOLS_REGISTRY: Record<string, (...args: unknown[]) => Promise<unknown>> = {
  'json-formatter': jsonFormatter,
  'json-minifier': jsonMinifier,
  'json-validator': jsonValidator,
  'json-to-csv': jsonToCsv,
  'uuid-generator': uuidGenerator,
  'base64-encoder': base64Encoder,
  'base64-decoder': base64Decoder,
  'url-encoder': urlEncoder,
  'url-decoder': urlDecoder,
  'html-entities-encoder': htmlEntitiesEncoder,
  'sha256-hash': sha256Hash,
  'md5-hash': md5Hash,
  'random-string': randomString,
  'password-strength': passwordStrength,
  'random-number': randomNumber,
  'random-color': randomColor,
  'string-case-converter': stringCaseConverter,
  'string-reverse': stringReverse,
  'string-trimmer': stringTrimmer,
  'string-analyzer': stringAnalyzer,
  'text-to-ascii': textToAscii,
  'ascii-to-text': asciiToText,
  'text-entropy': textEntropy,
  'text-to-sentence-case': textToSentenceCase,
  'word-counter': wordCounter,
  'line-counter': lineCounter,
  'duplicate-remover': duplicateRemover,
  'text-diff': textDiff,
  'image-resizer': imageResizer,
  'image-to-base64': imageToBase64,
  'base64-to-image': base64ToImage,
  'pdf-text-extractor': pdfTextExtractor,
  'image-compressor': imageCompressor,
  'file-size-calculator': fileSizeCalculator,
  'mime-type-detector': mimeTypeDetector,
  'file-namer': fileNamer,
  'image-cropper': imageCropper,
  'image-rotator': imageRotator,
  'csv-to-json': csvToJson,
  'json-to-xml': jsonToXml,
  'timer': timer,
  'stopwatch': stopwatch,
  'markdown-to-html': markdownToHtml,
  'html-to-markdown': htmlToMarkdown,
  'date-formatter': dateFormatter,
  'time-zone-converter': timeZoneConverter,
  'unix-timestamp-converter': unixTimestampConverter,
  'qr-code-generator': qrCodeGenerator,
  'barcode-generator': barcodeGenerator,
  'color-converter': colorConverter,
  'unit-converter': unitConverter,
};
