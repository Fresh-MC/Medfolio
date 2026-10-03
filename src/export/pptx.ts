import pptxgen from 'pptxgenjs'
import type { CanvasDocument, CanvasElement, CanvasSlide } from '../canvas/types'
import type { TemplateId } from '../templates/types'

type TemplateStyle = { background: string; accent: string; ink: string; muted: string; tableHeader: string }

const styles: Record<TemplateId, TemplateStyle> = {
  'clinical-audit': { background: 'F5F7F3', accent: '4F8D82', ink: '19343A', muted: '71827E', tableHeader: 'DDEBE4' },
  'case-presentation': { background: 'F7F3F0', accent: 'C86F5E', ink: '2D3438', muted: '7F8584', tableHeader: 'F0DED8' },
  research: { background: 'F3F6F7', accent: '557C9B', ink: '203442', muted: '72828C', tableHeader: 'DDE8EF' },
  'literature-review': { background: 'F6F5F0', accent: '8B7861', ink: '39352E', muted: '878176', tableHeader: 'EAE5D8' },
  'department-review': { background: 'F3F6F4', accent: '477D70', ink: '1E3431', muted: '71827E', tableHeader: 'DCEAE4' },
  academic: { background: 'F5F3F7', accent: '75668D', ink: '302B3D', muted: '837F8E', tableHeader: 'E6E0EE' },
  'data-analytics': { background: 'F1F5F6', accent: '3D7B88', ink: '1D343A', muted: '73878C', tableHeader: 'D9EAED' },
}

export async function exportCanvasToPptx(document: CanvasDocument): Promise<void> {
  const pptx = new pptxgen()
  const style = styles[document.templateId]
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'MEDFOLIO'
  pptx.company = 'MEDFOLIO'
  pptx.subject = document.templateName
  pptx.title = document.title
  pptx.theme = { headFontFace: 'Source Serif 4', bodyFontFace: 'DM Sans' }

  document.slides.forEach((slide) => addSlide(pptx, slide, style, document))
  await pptx.writeFile({ fileName: `${safeFileName(document.title)}.pptx` })
}

function addSlide(pptx: pptxgen, canvasSlide: CanvasSlide, style: TemplateStyle, document: CanvasDocument) {
  const slide = pptx.addSlide()
  slide.background = { color: style.background }
  const title = canvasSlide.elements.find((element) => element.kind === 'text')
  slide.addText(title?.text ?? `Slide ${canvasSlide.order}`, { x: 0.65, y: 0.45, w: 11.95, h: 0.62, fontFace: 'Source Serif 4', fontSize: 25, bold: true, color: style.ink, margin: 0, breakLine: false })
  let cursorY = 1.35
  const contentElements = canvasSlide.elements.filter((element) => element !== title)
  contentElements.forEach((element) => {
    const height = addElement(pptx, slide, element, style, cursorY)
    cursorY += height + 0.14
  })
  slide.addText(`MEDFOLIO · ${document.templateName} · ${provenanceForSlide(canvasSlide)}`, { x: 0.65, y: 7.05, w: 11.95, h: 0.18, fontFace: 'DM Mono', fontSize: 6.5, color: style.muted, margin: 0, fit: 'shrink' })
}

function addElement(pptx: pptxgen, slide: pptxgen.Slide, element: CanvasElement, style: TemplateStyle, y: number): number {
  if (element.kind === 'text') {
    slide.addText(element.text, { x: 0.8, y, w: 11.35, h: 0.55, fontFace: 'DM Sans', fontSize: 13, color: style.ink, margin: 0.04, breakLine: false, fit: 'shrink' })
    return 0.56
  }
  if (element.kind === 'metric' && element.metric) {
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 2.55, h: 0.9, rectRadius: 0.05, fill: { color: style.tableHeader }, line: { color: style.tableHeader } })
    slide.addText(element.metric.value, { x: 0.98, y: y + 0.12, w: 2.2, h: 0.35, fontFace: 'Source Serif 4', fontSize: 22, bold: true, color: style.accent, margin: 0 })
    slide.addText(element.metric.label, { x: 0.98, y: y + 0.55, w: 2.2, h: 0.17, fontFace: 'DM Sans', fontSize: 8, color: style.muted, margin: 0, fit: 'shrink' })
    return 0.95
  }
  if (element.kind === 'table' && element.table) {
    const rows = [element.table.headers, ...element.table.rows].map((row) => row.map((cell) => ({ text: cell, options: { color: style.ink, fontFace: 'DM Sans', fontSize: 8 } })))
    slide.addTable(rows, { x: 0.8, y, w: 11.35, h: Math.min(2.5, 0.32 * rows.length + 0.15), border: { type: 'solid', color: 'D8E0DA', pt: 0.5 }, fill: { color: style.background }, color: style.ink, fontFace: 'DM Sans', fontSize: 8, margin: 0.06, bold: false, rowH: 0.3, valign: 'middle', breakLine: false })
    return Math.min(2.65, 0.32 * rows.length + 0.25)
  }
  if (element.kind === 'chart' && element.chart) {
    const chartType = element.chart.type === 'line' ? pptx.ChartType.line : pptx.ChartType.bar
    slide.addChart(chartType, [{ name: element.chart.title, labels: element.chart.labels, values: element.chart.values.map((value) => Number(value) || 0) }], { x: 0.8, y, w: 11.35, h: 2.25, catAxisLabelFontFace: 'DM Sans', catAxisLabelFontSize: 8, valAxisLabelFontFace: 'DM Sans', valAxisLabelFontSize: 8, chartColors: [style.accent], showLegend: false, showTitle: true, title: element.chart.title, titleFontFace: 'Source Serif 4', titleFontSize: 13, showValue: true, showValAxisTitle: false, showCatAxisTitle: false, catGridLine: { color: 'D8E0DA' } })
    return 2.35
  }
  slide.addText(element.kind === 'image' ? `Image placeholder\n${element.text}` : `[Unsupported canvas element: ${element.kind}]`, { x: 0.8, y, w: 11.35, h: 1.05, fontFace: 'DM Sans', fontSize: 11, color: style.muted, italic: true, align: 'center', valign: 'middle', fill: { color: style.tableHeader, transparency: 12 }, line: { color: style.accent, pt: 0.75 }, margin: 0.1, fit: 'shrink' })
  return 1.1
}

function provenanceForSlide(slide: CanvasSlide) {
  const values = slide.elements.flatMap((element) => element.provenance.map((source) => `${source.sourceFile}${source.pageNumber ? ` p.${source.pageNumber}` : ''}${source.sheetName ? ` ${source.sheetName}` : ''}`))
  return [...new Set(values)].join(' | ') || 'User-created content'
}

function safeFileName(title: string) {
  return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'medfolio-presentation'
}
