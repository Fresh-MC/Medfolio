import type { PresentationDraft } from '../presentation/types'
import type { CanvasDocument, CanvasElement, CanvasSlide } from './types'

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

function generatedText(elementId: string, text: string, provenance: CanvasElement['provenance']): CanvasElement {
  return { id: elementId, kind: 'text', text, sourceGenerated: true, edited: false, provenance }
}

export function canvasFromDraft(draft: PresentationDraft): CanvasDocument {
  const slides: CanvasSlide[] = draft.content.map((content) => {
    const planned = draft.plan.slides[content.order - 1]
    const elements: CanvasElement[] = [generatedText(`${content.slideId}-title`, content.title, planned?.sourceRequirements ?? [])]
    content.body.forEach((item, index) => elements.push(generatedText(`${content.slideId}-body-${index + 1}`, item.text, item.provenance)))
    content.keyFindings.forEach((item, index) => elements.push(generatedText(`${content.slideId}-finding-${index + 1}`, item.text, item.provenance)))
    content.metrics.forEach((metric, index) => elements.push({ id: `${content.slideId}-metric-${index + 1}`, kind: 'metric', text: `${metric.value} ${metric.label}`, metric: { label: metric.label, value: metric.value }, sourceGenerated: true, edited: false, provenance: metric.provenance }))
    content.tables.forEach((table, index) => elements.push({ id: `${content.slideId}-table-${index + 1}`, kind: 'table', text: 'Extracted table', table, sourceGenerated: true, edited: false, provenance: table.provenance }))
    content.charts.forEach((chart, index) => elements.push({ id: `${content.slideId}-chart-${index + 1}`, kind: 'chart', text: chart.title, chart, sourceGenerated: true, edited: false, provenance: chart.provenance }))
    content.imageRequirements.forEach((item, index) => elements.push({ id: `${content.slideId}-image-${index + 1}`, kind: 'image', text: item.text, sourceGenerated: true, edited: false, provenance: item.provenance }))
    return { id: content.slideId, order: content.order, elements }
  })
  return { id: `canvas-${draft.template.id}-${draft.profile.source.name}`, title: `${draft.template.name} · ${draft.profile.source.name}`, templateName: draft.template.name, sourceFile: draft.profile.source.name, templateId: draft.template.id, slides, savedAt: '' }
}

export function addBlankSlide(document: CanvasDocument): CanvasDocument {
  const slideId = id('slide')
  const slide: CanvasSlide = { id: slideId, order: document.slides.length + 1, elements: [generatedText(`${slideId}-title`, 'New slide', [])] }
  return { ...document, slides: [...document.slides, slide] }
}

export function duplicateSlide(document: CanvasDocument, slideId: string): CanvasDocument {
  const source = document.slides.find((slide) => slide.id === slideId)
  if (!source) return document
  const newSlideId = id(`slide-copy-${source.id}`)
  const copy: CanvasSlide = { id: newSlideId, order: source.order + 1, elements: source.elements.map((element) => ({ ...element, id: id(`element-copy-${element.id}`), sourceGenerated: false, edited: true, table: element.table ? { ...element.table, rows: element.table.rows.map((row) => [...row]) } : undefined, chart: element.chart ? { ...element.chart, labels: [...element.chart.labels], values: [...element.chart.values] } : undefined })) }
  return reorderSlides({ ...document, slides: [...document.slides, copy] })
}

export function deleteSlide(document: CanvasDocument, slideId: string): CanvasDocument {
  if (document.slides.length <= 1) return document
  return reorderSlides({ ...document, slides: document.slides.filter((slide) => slide.id !== slideId) })
}

export function moveSlide(document: CanvasDocument, slideId: string, direction: -1 | 1): CanvasDocument {
  const slides = [...document.slides]
  const index = slides.findIndex((slide) => slide.id === slideId)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= slides.length) return document
  ;[slides[index], slides[nextIndex]] = [slides[nextIndex], slides[index]]
  return reorderSlides({ ...document, slides })
}

function reorderSlides(document: CanvasDocument): CanvasDocument {
  return { ...document, slides: document.slides.map((slide, index) => ({ ...slide, order: index + 1 })) }
}

export function updateElement(document: CanvasDocument, slideId: string, elementId: string, update: Partial<CanvasElement>): CanvasDocument {
  return { ...document, slides: document.slides.map((slide) => slide.id !== slideId ? slide : { ...slide, elements: slide.elements.map((element) => element.id !== elementId ? element : { ...element, ...update, sourceGenerated: false, edited: true }) }) }
}

export function addElement(document: CanvasDocument, slideId: string, kind: CanvasElement['kind']): CanvasDocument {
  const element: CanvasElement = { id: id('element'), kind, text: kind === 'image' ? 'Image placeholder. Add source image later.' : kind === 'table' ? 'Editable table' : kind === 'chart' ? 'Editable chart' : kind === 'metric' ? '0 Metric' : 'New text', sourceGenerated: false, edited: true, provenance: [] }
  if (kind === 'metric') element.metric = { label: 'Metric', value: '0' }
  if (kind === 'table') element.table = { headers: ['Column A', 'Column B'], rows: [['Value', 'Edit me']], provenance: [] }
  if (kind === 'chart') element.chart = { type: 'bar', title: 'Chart title', labels: ['A', 'B'], values: ['0', '0'], provenance: [] }
  return { ...document, slides: document.slides.map((slide) => slide.id === slideId ? { ...slide, elements: [...slide.elements, element] } : slide) }
}