import type { ExtractedTable, Provenance, StructuredDocumentProfile } from '../intelligence/types'
import type { TemplateDefinition } from '../templates/types'
import { validateSlidePlan } from './planning'
import type { ChartSpecification, GeneratedSlideContent, GroundedMetric, GroundedText, PresentationDraft, SlidePlan } from './types'

function firstSentences(profile: StructuredDocumentProfile, count: number): GroundedText[] {
  return profile.pages.flatMap((page) => page.text.split(/(?<=[.!?])\s+/).map((text) => text.trim()).filter(Boolean).slice(0, count).map((text) => ({ text, provenance: [page.provenance] }))).slice(0, count)
}

function tableContent(table: ExtractedTable): { headers: string[]; rows: string[][]; provenance: Provenance[] } {
  const [headers = [], ...rows] = table.rows
  return { headers, rows: rows.slice(0, 8), provenance: [table.provenance] }
}

function chartContent(table: ExtractedTable, type: ChartSpecification['type']): ChartSpecification | null {
  const [headers = [], ...rows] = table.rows
  const numericIndex = headers.findIndex((_, index) => rows.some((row) => row[index] && Number.isFinite(Number(row[index]))))
  if (numericIndex < 0) return null
  const values = rows.map((row) => row[numericIndex]).filter((value): value is string => Boolean(value && Number.isFinite(Number(value))))
  const labels = rows.slice(0, values.length).map((row, index) => row[0] || `Row ${index + 1}`)
  return { type, title: headers[numericIndex] || 'Extracted values', labels, values, provenance: [table.provenance] }
}

function metricsFromTable(table: ExtractedTable): GroundedMetric[] {
  const [headers = [], ...rows] = table.rows
  const numericIndex = headers.findIndex((_, index) => rows.some((row) => row[index] && Number.isFinite(Number(row[index]))))
  if (numericIndex < 0) return []
  return rows.slice(0, 4).filter((row) => row[numericIndex] && Number.isFinite(Number(row[numericIndex]))).map((row, index) => ({ label: row[0] || `Row ${index + 1}`, value: row[numericIndex], provenance: [table.provenance] }))
}

export function generateSlideContent(profile: StructuredDocumentProfile, template: TemplateDefinition, plan: SlidePlan): PresentationDraft {
  const validation = validateSlidePlan(plan)
  if (!validation.valid) throw new Error(validation.errors.join(' '))
  const sentences = firstSentences(profile, 6)
  const table = profile.tables[0]
  const content: GeneratedSlideContent[] = plan.slides.map((slide, index) => {
    const body = index === 0 ? [{ text: `Source: ${profile.source.name}.`, provenance: profile.provenance.slice(0, 1) }] : sentences.slice(index % Math.max(sentences.length, 1), index % Math.max(sentences.length, 1) + 2)
    const keyFindings = index > 0 && index < plan.slides.length - 1 ? sentences.slice(index % Math.max(sentences.length, 1), index % Math.max(sentences.length, 1) + 1) : []
    const tables = table && slide.visualizationType === 'table' ? [tableContent(table)] : []
    const chart = table && (slide.visualizationType === 'bar-chart' || slide.visualizationType === 'line-chart') ? chartContent(table, slide.visualizationType === 'bar-chart' ? 'bar' : 'line') : null
    const references = [...new Map(profile.provenance.map((provenance) => [`${provenance.sourceFile}-${provenance.pageNumber}-${provenance.sheetName}`, provenance])).values()]
    const imageRequirements = slide.visualizationType === 'image' ? [{ text: 'Use source images only. Do not add unsupported clinical imagery.', provenance: profile.pages.filter((page) => page.hasImages).map((page) => page.provenance) }] : []
    return { slideId: slide.id, order: slide.order, title: slide.title, body, keyFindings, metrics: table ? metricsFromTable(table) : [], tables, charts: chart ? [chart] : [], references, imageRequirements }
  })
  return { profile, template, plan, content }
}