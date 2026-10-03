import type { ParsedDocument, StructuredDocumentProfile } from '../types'

const topicWords = ['cardiology', 'oncology', 'sleep', 'resident', 'clinical', 'trial', 'review', 'outcomes', 'methodology', 'population', 'diagnosis', 'treatment']

export function buildDocumentProfile(parsed: ParsedDocument, prompt: string): StructuredDocumentProfile {
  const extractedText = parsed.pages.map((page) => page.text).filter(Boolean).join('\n\n')
  const lowerText = `${extractedText} ${prompt}`.toLowerCase()
  const topics = topicWords.filter((topic) => lowerText.includes(topic)).map((topic) => topic[0].toUpperCase() + topic.slice(1))
  const sections = [...new Set(parsed.pages.flatMap((page) => page.headings))]
  const hasTables = parsed.pages.some((page) => page.tables.length > 0)
  const hasImages = parsed.pages.some((page) => page.hasImages)
  const documentType = parsed.fileType === 'xlsx' || parsed.fileType === 'xls' ? 'Spreadsheet' : parsed.fileType === 'pdf' ? 'PDF document' : parsed.fileType === 'docx' ? 'Word document' : parsed.fileType === 'image' ? 'Scanned image' : 'Text document'
  const purpose = lowerText.includes('review') ? 'Evidence review' : lowerText.includes('protocol') ? 'Research protocol' : lowerText.includes('presentation') || lowerText.includes('slides') ? 'Presentation source' : 'Unclassified source'
  const audience = lowerText.includes('resident') || lowerText.includes('grand rounds') ? 'Clinical teaching team' : lowerText.includes('department') || lowerText.includes('service line') ? 'Department leadership' : lowerText.includes('student') || lowerText.includes('academic') ? 'Academic audience' : 'Clinical and academic team'
  return { source: { name: parsed.originalFile.name, type: parsed.fileType, mimeType: parsed.originalFile.type, size: parsed.originalFile.size, originalFile: parsed.originalFile }, metadata: parsed.metadata, documentType, purpose, audience, topics, sections, pages: parsed.pages, tables: parsed.pages.flatMap((page) => page.tables), characteristics: { hasText: Boolean(extractedText), hasTables, hasCharts: parsed.pages.some((page) => page.hasCharts), hasImages }, extractedText, provenance: parsed.pages.map((page) => page.provenance) }
}