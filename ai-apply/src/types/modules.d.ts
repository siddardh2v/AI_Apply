// pdf-parse ships types for its main entry but not the /lib subpath we import
// (to avoid its debug-mode file read). Declare the subpath module.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: unknown;
  }
  function pdf(dataBuffer: Buffer | Uint8Array): Promise<PdfParseResult>;
  export default pdf;
}
