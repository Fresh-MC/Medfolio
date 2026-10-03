export type NavKey = 'home' | 'projects' | 'sources' | 'drafts' | 'templates' | 'settings'

export const navItems: { key: NavKey; label: string; icon: 'folder' | 'file' | 'spark' | 'clock'; count?: string }[] = [
  { key: 'home', label: 'Overview', icon: 'spark' },
  { key: 'projects', label: 'Projects', icon: 'folder', count: '08' },
  { key: 'sources', label: 'Source library', icon: 'file', count: '142' },
  { key: 'drafts', label: 'Drafts & reviews', icon: 'clock', count: '12' },
  { key: 'templates', label: 'Templates', icon: 'file' },
]

export const projects = [
  { id: 'cardio', title: 'Cardiovascular outcomes in long-COVID', type: 'Systematic review', files: 28, updated: 'Today, 09:42', shortCode: 'CO', tone: 'blue' },
  { id: 'sleep', title: 'Sleep quality & resident wellbeing', type: 'Research brief', files: 16, updated: 'Yesterday', shortCode: 'SQ', tone: 'coral' },
  { id: 'oncology', title: 'Oncology service line update', type: 'Grand rounds', files: 42, updated: '28 Sep 2026', shortCode: 'OS', tone: 'green' },
] as const

export const tasks = [
  { id: 'review-1', title: 'Review evidence summary', project: 'Cardiovascular outcomes', time: 'Due today', tone: 'coral' },
  { id: 'review-2', title: 'Add source annotations', project: 'Sleep quality & resident wellbeing', time: 'Due tomorrow', tone: 'gold' },
  { id: 'review-3', title: 'Approve slide outline', project: 'Oncology service line update', time: 'In 3 days', tone: 'blue' },
] as const
