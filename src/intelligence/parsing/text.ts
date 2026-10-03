import type { ExtractedPage, ParsedDocument, SupportedFileType } from '../types'

const headingPattern = /^(?:\d+(?:\.\d+)*[.)]?\s+)?[A-Z][^.!?]{2,80}$/

export function createTextPage(text: string, fileName: string, fileType: SupportedFileType): ParsedDocument {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const headings = lines.filter((line) => headingPattern.test(line) || line.length < 70 && line === line.toUpperCase())
  const page: ExtractedPage = { pageNumber: 1, text, headings, tables: [], hasImages: false, hasCharts: false, ocrUsed: false, provenance: { sourceFile: fileName, pageNumber: 1 } }
  return { originalFile: new File([text], fileName, { type: fileType === 'text' ? 'text/plain' : undefined }), fileType, pages: [page], metadata: {}, needsOcr: false }
}