export type SupportedFileType = 'pdf' | 'docx' | 'xlsx' | 'xls' | 'image' | 'text'

export type ProcessingStage = 'parsing' | 'ocr' | 'understanding' | 'complete' | 'error'

export type ContentCharacteristics = {
  hasText: boolean
  hasTables: boolean
  hasCharts: boolean
  hasImages: boolean
}

export type Provenance = {
  sourceFile: string
  pageNumber?: number
  sheetName?: string
}

export type ExtractedTable = {
  rows: string[][]
  provenance: Provenance
}

export type ExtractedPage = {
  pageNumber: number
  text: string
  headings: string[]
  tables: ExtractedTable[]
  hasImages: boolean
  hasCharts: boolean
  ocrUsed: boolean
  provenance: Provenance
}

export type ParsedDocument = {
  originalFile: File
  fileType: SupportedFileType
  pages: ExtractedPage[]
  metadata: Record<string, string>
  needsOcr: boolean
}

export type StructuredDocumentProfile = {
  source: {
    name: string
    type: SupportedFileType
    mimeType: string
    size: number
    originalFile: File
  }
  metadata: Record<string, string>
  documentType: string
  purpose: string
  audience: string
  topics: string[]
  sections: string[]
  pages: ExtractedPage[]
  tables: ExtractedTable[]
  characteristics: ContentCharacteristics
  extractedText: string
  provenance: Provenance[]
}

export type PipelineUpdate = {
  stage: ProcessingStage
  message: string
  progress?: number
}