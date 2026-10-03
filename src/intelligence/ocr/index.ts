import { createWorker } from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import type { ExtractedPage, ParsedDocument } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

export async function runOcr(parsed: ParsedDocument, onProgress: (progress: number) => void): Promise<ParsedDocument> {
  if (!parsed.needsOcr && parsed.fileType !== 'image') return parsed
  const worker = await createWorker('eng', 1, { logger: (event) => { if (event.status === 'recognizing text') onProgress(Math.round(event.progress * 100)) } })
  try {
    if (parsed.fileType === 'image') {
      const result = await worker.recognize(parsed.originalFile)
      const page: ExtractedPage = { pageNumber: 1, text: result.data.text.trim(), headings: [], tables: [], hasImages: true, hasCharts: false, ocrUsed: true, provenance: { sourceFile: parsed.originalFile.name, pageNumber: 1 } }
      return { ...parsed, pages: [page], needsOcr: false }
    }
    if (parsed.fileType === 'pdf') {
      const pdf = await pdfjsLib.getDocument({ data: await parsed.originalFile.arrayBuffer() }).promise
      const pages = [...parsed.pages]
      for (const page of pages.filter((candidate) => !candidate.text && candidate.hasImages)) {
        const pdfPage = await pdf.getPage(page.pageNumber)
        const viewport = pdfPage.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await pdfPage.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise
        const result = await worker.recognize(canvas)
        const pageIndex = pages.findIndex((candidate) => candidate.pageNumber === page.pageNumber)
        pages[pageIndex] = { ...page, text: result.data.text.trim(), ocrUsed: true }
      }
      return { ...parsed, pages, needsOcr: false }
    }
    return parsed
  } finally {
    await worker.terminate()
  }
}