import type { StructuredDocumentProfile } from '../intelligence/types'

export type TemplateId = 'clinical-audit' | 'case-presentation' | 'research' | 'literature-review' | 'department-review' | 'academic' | 'data-analytics'

export type TemplateSchema = {
  contentSlots: string[]
  preferredSections: string[]
  tone: string
}

export type TemplateDefinition = {
  id: TemplateId
  name: string
  description: string
  audience: string
  bestFor: string[]
  signals: { documentTypes?: string[]; purposes?: string[]; audiences?: string[]; requires?: ('text' | 'tables' | 'charts' | 'images')[] }
  schema: TemplateSchema
}

export type TemplateRecommendation = {
  template: TemplateDefinition
  score: number
  reasons: string[]
}

export type TemplateMemory = {
  preferredTemplateId?: TemplateId
  department?: string
  recentSelections: TemplateId[]
}

export type TemplateSelection = {
  profile: StructuredDocumentProfile
  recommendations: TemplateRecommendation[]
}