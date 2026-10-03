import type { ChartSpecification, GroundedTable, PresentationDraft } from '../presentation/types'
import type { Provenance } from '../intelligence/types'

export type CanvasElementKind = 'text' | 'metric' | 'table' | 'chart' | 'image'

export type CanvasMetric = { label: string; value: string }

export type CanvasElement = {
  id: string
  kind: CanvasElementKind
  text: string
  sourceGenerated: boolean
  edited: boolean
  provenance: Provenance[]
  metric?: CanvasMetric
  table?: GroundedTable
  chart?: ChartSpecification
}

export type CanvasSlide = {
  id: string
  order: number
  elements: CanvasElement[]
}

export type CanvasDocument = {
  id: string
  title: string
  templateName: string
  sourceFile: string
  templateId: PresentationDraft['template']['id']
  slides: CanvasSlide[]
  savedAt: string
}