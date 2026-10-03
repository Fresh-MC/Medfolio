import type { Provenance, StructuredDocumentProfile } from '../intelligence/types'
import type { TemplateDefinition } from '../templates/types'

export type VisualizationType = 'title' | 'text' | 'metric' | 'table' | 'bar-chart' | 'line-chart' | 'reference' | 'image'

export type SlidePlanItem = {
  id: string
  order: number
  title: string
  purpose: string
  contentRequirements: string[]
  visualizationType: VisualizationType
  sourceRequirements: Provenance[]
}

export type SlidePlan = {
  templateId: TemplateDefinition['id']
  sourceFiles: string[]
  slideCount: number
  slides: SlidePlanItem[]
}

export type PlanValidation = {
  valid: boolean
  errors: string[]
}

export type GroundedText = {
  text: string
  provenance: Provenance[]
}

export type GroundedMetric = {
  label: string
  value: string
  provenance: Provenance[]
}

export type GroundedTable = {
  headers: string[]
  rows: string[][]
  provenance: Provenance[]
}

export type ChartSpecification = {
  type: 'bar' | 'line'
  title: string
  labels: string[]
  values: string[]
  provenance: Provenance[]
}

export type GeneratedSlideContent = {
  slideId: string
  order: number
  title: string
  body: GroundedText[]
  keyFindings: GroundedText[]
  metrics: GroundedMetric[]
  tables: GroundedTable[]
  charts: ChartSpecification[]
  references: Provenance[]
  imageRequirements: GroundedText[]
}

export type PresentationDraft = {
  profile: StructuredDocumentProfile
  template: TemplateDefinition
  plan: SlidePlan
  content: GeneratedSlideContent[]
}