import type { StructuredDocumentProfile, Provenance } from '../intelligence/types'
import type { TemplateDefinition } from '../templates/types'
import type { PlanValidation, SlidePlan, SlidePlanItem, VisualizationType } from './types'

function sourceRequirements(profile: StructuredDocumentProfile, index: number): Provenance[] {
  const page = profile.pages[index % Math.max(profile.pages.length, 1)]
  return page ? [page.provenance] : profile.provenance.slice(0, 1)
}

function visualizationFor(template: TemplateDefinition, profile: StructuredDocumentProfile, index: number): VisualizationType {
  if (index === 0) return 'title'
  if (template.id === 'data-analytics' && profile.characteristics.hasTables) return index % 2 === 0 ? 'bar-chart' : 'table'
  if (template.id === 'case-presentation' && profile.characteristics.hasImages) return 'image'
  if (index === profile.sections.length && profile.provenance.length) return 'reference'
  return 'text'
}

export function buildSlidePlan(profile: StructuredDocumentProfile, template: TemplateDefinition): SlidePlan {
  const sectionTitles = profile.sections.slice(0, 5)
  const plannedTitles = [template.name, ...sectionTitles, 'Evidence and sources']
  const titles = [...new Set(plannedTitles)].slice(0, 7)
  const slides: SlidePlanItem[] = titles.map((title, index) => ({ id: `${template.id}-${index + 1}`, order: index + 1, title, purpose: index === 0 ? `Orient the audience to ${template.name.toLowerCase()}.` : index === titles.length - 1 ? 'Keep source coverage visible for review.' : `Explain ${title.toLowerCase()} using only extracted source evidence.`, contentRequirements: index === 0 ? ['Source context', 'Audience framing'] : index === titles.length - 1 ? ['References', 'Page and section provenance'] : ['Concise evidence summary', 'Key findings where present'], visualizationType: visualizationFor(template, profile, index), sourceRequirements: sourceRequirements(profile, index) }))
  return { templateId: template.id, sourceFiles: [profile.source.name], slideCount: slides.length, slides }
}

export function validateSlidePlan(plan: SlidePlan): PlanValidation {
  const errors: string[] = []
  if (plan.slideCount < 1 || plan.slideCount !== plan.slides.length) errors.push('Slide count must match planned slides.')
  plan.slides.forEach((slide, index) => {
    if (slide.order !== index + 1) errors.push(`Slide ${slide.id} order is invalid.`)
    if (!slide.title.trim()) errors.push(`Slide ${slide.id} needs a title.`)
    if (!slide.contentRequirements.length) errors.push(`Slide ${slide.id} needs content requirements.`)
    if (!slide.sourceRequirements.length) errors.push(`Slide ${slide.id} needs source requirements.`)
  })
  return { valid: errors.length === 0, errors }
}