import { runOcr } from './ocr'
import { parseDocument } from './parsing'
import { buildDocumentProfile } from './understanding/profile'
import type { PipelineUpdate, StructuredDocumentProfile } from './types'

export async function processDocument(file: File, prompt: string, onUpdate: (update: PipelineUpdate) => void): Promise<StructuredDocumentProfile> {
  onUpdate({ stage: 'parsing', message: 'Parsing source structure', progress: 12 })
  let parsed = await parseDocument(file)
  onUpdate({ stage: 'parsing', message: `Read ${parsed.pages.length || 1} source page${parsed.pages.length === 1 ? '' : 's'}`, progress: 38 })
  if (parsed.needsOcr || parsed.fileType === 'image') {
    onUpdate({ stage: 'ocr', message: 'Checking for readable text', progress: 45 })
    parsed = await runOcr(parsed, (progress) => onUpdate({ stage: 'ocr', message: `OCR in progress ${progress}%`, progress: 45 + Math.round(progress * 0.3) }))
  }
  onUpdate({ stage: 'understanding', message: 'Building structured document profile', progress: 82 })
  const profile = buildDocumentProfile(parsed, prompt)
  onUpdate({ stage: 'complete', message: 'Structured profile ready', progress: 100 })
  return profile
}