/**
 * Web Worker for Tesseract.js OCR processing.
 *
 * Full implementation depends on Tesseract.js browser bundle being available.
 * This stub handles the worker message protocol so the module compiles and
 * can be dynamically imported by the Tier 1 OCR flow.
 *
 * When Tesseract.js is bundled, replace the stub postMessage below with:
 *   const worker = await Tesseract.createWorker(language);
 *   await worker.loadLanguage(language);
 *   await worker.initialize(language);
 *   const { data } = await worker.recognize(imagePath);
 *   await worker.terminate();
 *   self.postMessage({ jobId, status: 'complete', result: data });
 */

self.onmessage = async (event: MessageEvent) => {
  const { jobId, imagePath, language } = event.data as {
    jobId: string;
    imagePath: string;
    language: string;
  };

  // Suppress unused-variable lint warnings for stub args
  void imagePath;
  void language;

  // TODO: import and initialize Tesseract.js here when bundle is available
  self.postMessage({
    jobId,
    status: 'error',
    error: 'tesseract-not-initialized',
  });
};
