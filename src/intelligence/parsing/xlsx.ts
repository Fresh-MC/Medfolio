import * as XLSX from 'xlsx'
import type { ExtractedPage, ExtractedTable, ParsedDocument } from '../types'

export async function parseXlsx(file: File): Promise<ParsedDocument> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
  const pages: ExtractedPage[] = []
  const tables: ExtractedTable[] = []

  workbook.SheetNames.forEach((sheetName, index) => {
    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' })
    const text = rows.map((row) => row.join('\t')).join('\n').trim()
    const sheet = workbook.Sheets[sheetName] as XLSX.WorkSheet & { '!charts'?: unknown[] }
    const hasCharts = Boolean(sheet['!charts']?.length)
    const provenance = { sourceFile: file.name, pageNumber: index + 1, sheetName }
    tables.push({ rows, provenance })
    pages.push({ pageNumber: index + 1, text, headings: [sheetName], tables: [{ rows, provenance }], hasImages: false, hasCharts, ocrUsed: false, provenance })
  })

  return { originalFile: file, fileType: file.name.toLowerCase().endsWith('.xls') ? 'xls' : 'xlsx', pages, metadata: { sheets: workbook.SheetNames.join(', ') }, needsOcr: false }
}