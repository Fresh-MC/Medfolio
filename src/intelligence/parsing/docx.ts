import * as mammoth from 'mammoth'
import { createTextPage } from './text'
import type { ParsedDocument } from '../types'

export async function parseDocx(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const parsed = createTextPage(result.value, file.name, 'docx')
  const html = await mammoth.convertToHtml({ arrayBuffer })
  const document = new DOMParser().parseFromString(html.value, 'text/html')
  const tables = Array.from(document.querySelectorAll('table')).map((table) => ({ rows: Array.from(table.querySelectorAll('tr')).map((row) => Array.from(row.querySelectorAll('th,td')).map((cell) => cell.textContent?.trim() ?? '')), provenance: { sourceFile: file.name, pageNumber: 1 } }))
  return { ...parsed, originalFile: file, pages: parsed.pages.map((page) => ({ ...page, tables })), metadata: { extractionMessages: String(result.messages.length) } }
}