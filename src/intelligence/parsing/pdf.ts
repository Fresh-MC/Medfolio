import * as pdfjsLib from 'pdfjs-dist'
import type { ExtractedPage, ParsedDocument } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

export async function parsePdf(file: File): Promise<ParsedDocument> {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  const metadata = await pdf.getMetadata().catch(() => ({ info: {} }))
  const pages: ExtractedPage[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items.map((item) => 'str' in item ? item.str : '').join(' ').trim()
    const lines = text.split(/\s{2,}|\r?\n/).map((line) => line.trim()).filter(Boolean)
    const headings = lines.filter((line) => line.length < 90 && (line === line.toUpperCase() || /^[A-Z][^.!?]{2,80}$/.test(line)))
    const tableRows = lines.filter((line) => /\t|\s{2,}/.test(line)).map((line) => line.split(/\t+|\s{2,}/).map((cell) => cell.trim()).filter(Boolean))
    const tables = tableRows.length > 1 ? [{ rows: tableRows, provenance: { sourceFile: file.name, pageNumber } }] : []
    const operatorList = await page.getOperatorList()
    const hasImages = operatorList.fnArray.some((operation) => operation === pdfjsLib.OPS.paintImageMaskXObject || operation === pdfjsLib.OPS.paintXObject)
    pages.push({ pageNumber, text, headings, tables, hasImages, hasCharts: false, ocrUsed: false, provenance: { sourceFile: file.name, pageNumber } })
  }

  const info = metadata.info as Record<string, unknown>
  return { originalFile: file, fileType: 'pdf', pages, metadata: Object.fromEntries(Object.entries(info).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, String(value)])), needsOcr: pages.some((page) => !page.text && page.hasImages) }
}