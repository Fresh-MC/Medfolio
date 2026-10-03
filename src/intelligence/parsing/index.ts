import { parseDocx } from './docx'
import { parsePdf } from './pdf'
import { parseXlsx } from './xlsx'
import { createTextPage } from './text'
import type { ParsedDocument, SupportedFileType } from '../types'

function getFileType(file: File): SupportedFileType {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx')) return 'docx'
  if (name.endsWith('.xlsx')) return 'xlsx'
  if (name.endsWith('.xls')) return 'xls'
  if (file.type.startsWith('image/')) return 'image'
  return 'text'
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  switch (getFileType(file)) {
    case 'pdf': return parsePdf(file)
    case 'docx': return parseDocx(file)
    case 'xlsx':
    case 'xls': return parseXlsx(file)
    case 'image': return { originalFile: file, fileType: 'image', pages: [], metadata: {}, needsOcr: true }
    default: return { ...(createTextPage(await file.text(), file.name, 'text')), originalFile: file }
  }
}