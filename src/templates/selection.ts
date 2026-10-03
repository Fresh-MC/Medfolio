import type { StructuredDocumentProfile } from '../intelligence/types'
import { templateRegistry } from './registry'
import type { TemplateId, TemplateMemory, TemplateRecommendation } from './types'

function scoreTemplate(template: (typeof templateRegistry)[number], profile: StructuredDocumentProfile, memory: TemplateMemory): TemplateRecommendation {
  let score = 0
  const reasons: string[] = []
  const signals = template.signals
  if (signals.documentTypes?.includes(profile.documentType)) { score += 4; reasons.push(`matches ${profile.documentType.toLowerCase()}`) }
  if (signals.purposes?.includes(profile.purpose)) { score += 5; reasons.push(`fits ${profile.purpose.toLowerCase()}`) }
  if (signals.audiences?.includes(profile.audience)) { score += 4; reasons.push(`fits ${profile.audience.toLowerCase()}`) }
  if (signals.requires?.includes('text') && profile.characteristics.hasText) { score += 1; reasons.push('has source text') }
  if (signals.requires?.includes('tables') && profile.characteristics.hasTables) { score += 5; reasons.push('uses extracted tables') }
  if (signals.requires?.includes('charts') && profile.characteristics.hasCharts) { score += 5; reasons.push('uses detected charts') }
  if (signals.requires?.includes('images') && profile.characteristics.hasImages) { score += 2; reasons.push('includes source images') }
  const sectionMatches = template.schema.preferredSections.filter((section) => profile.sections.some((found) => found.toLowerCase().includes(section.toLowerCase())))
  if (sectionMatches.length) { score += Math.min(3, sectionMatches.length); reasons.push(`shares ${sectionMatches.length} section signal${sectionMatches.length === 1 ? '' : 's'}`) }
  if (memory.preferredTemplateId === template.id) { score += 3; reasons.push('matches your saved preference') }
  if (!reasons.length) reasons.push('available as a flexible starting point')
  return { template, score, reasons }
}

export function selectTemplates(profile: StructuredDocumentProfile, memory: TemplateMemory): TemplateRecommendation[] {
  return templateRegistry.map((template) => scoreTemplate(template, profile, memory)).sort((left, right) => right.score - left.score)
}

const memoryKey = 'medfolio.template-memory'

export function loadTemplateMemory(): TemplateMemory {
  try {
    const value = JSON.parse(localStorage.getItem(memoryKey) ?? '') as Partial<TemplateMemory>
    return { preferredTemplateId: value.preferredTemplateId, department: value.department, recentSelections: value.recentSelections ?? [] }
  } catch { return { recentSelections: [] } }
}

export function rememberTemplateSelection(templateId: TemplateId): TemplateMemory {
  const current = loadTemplateMemory()
  const recentSelections = [templateId, ...current.recentSelections.filter((id) => id !== templateId)].slice(0, 5)
  const next = { ...current, preferredTemplateId: templateId, recentSelections }
  localStorage.setItem(memoryKey, JSON.stringify(next))
  return next
}