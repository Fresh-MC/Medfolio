import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import './App.css'
import { Icon } from './components/Icon'
import { type NavKey } from './data/workspace'
import type { PipelineUpdate, StructuredDocumentProfile } from './intelligence/types'
import { loadTemplateMemory, rememberTemplateSelection, selectTemplates } from './templates/selection'
import type { TemplateMemory, TemplateRecommendation } from './templates/types'
import { generateSlideContent } from './presentation/content'
import { buildSlidePlan } from './presentation/planning'
import type { PresentationDraft } from './presentation/types'
import { CanvasWorkspace } from './canvas/CanvasWorkspace'
import { canvasFromDraft } from './canvas/model'
import { loadCanvas } from './canvas/storage'
import type { CanvasDocument } from './canvas/types'

type Route = NavKey | 'project'

type Attachment = { id: string; name: string; size: string; type: string; file: File }

const routeLabels: Record<Route, string> = {
  home: 'Home', projects: 'Projects', sources: 'Knowledge', drafts: 'Outputs',
  templates: 'Templates', settings: 'Settings', project: 'Project workspace',
}

const quietNav: { label: string; route: Route }[] = [
  { label: 'Projects', route: 'projects' },
  { label: 'Templates', route: 'templates' },
  { label: 'Knowledge', route: 'sources' },
  { label: 'Outputs', route: 'drafts' },
]

function getRoute(): Route {
  const value = window.location.hash.replace('#/', '') as Route
  return value in routeLabels ? value : 'home'
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (nextRoute: Route) => { window.location.hash = `/${nextRoute}` }

  return <div className="app-shell">
    <header className="minimal-header"><a className="brand-lockup" href="#/home"><span className="brand-mark">M</span><span><strong>medfolio</strong><small>clinical workspace</small></span></a><div className="header-meta"><span className="status-mark" /> Private workspace <a href="#/settings" aria-label="Open settings"><Icon name="settings" size={16} /></a></div></header>
    <main className="main-area">{route === 'home' ? <AIWorkspace /> : <PlaceholderPage route={route} onNavigate={navigate} />}</main>
    <nav className="quiet-nav" aria-label="Workspace navigation"><a className={route === 'home' ? 'quiet-nav--active' : ''} href="#/home">Home</a>{quietNav.map((item) => <a className={route === item.route ? 'quiet-nav--active' : ''} href={`#/${item.route}`} key={item.route}>{item.label}</a>)}</nav>
  </div>
}

function AIWorkspace() {
  const [prompt, setPrompt] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [dragging, setDragging] = useState(false)
  const [pipeline, setPipeline] = useState<PipelineUpdate | null>(null)
  const [profiles, setProfiles] = useState<StructuredDocumentProfile[]>([])
  const [processing, setProcessing] = useState(false)
  const [savedCanvas, setSavedCanvas] = useState<CanvasDocument | null>(() => loadCanvas())
  const fileInput = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files).map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: formatFileSize(file.size), type: file.name.split('.').pop()?.toUpperCase() ?? 'FILE', file }))
    setAttachments((current) => [...current, ...nextFiles.filter((file) => !current.some((item) => item.id === file.id))])
    setPipeline(null)
    setProfiles([])
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) addFiles(event.target.files); event.target.value = '' }
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (processing || !attachments.length) {
      if (!attachments.length) setPipeline({ stage: 'error', message: 'Attach a source file before processing.' })
      return
    }
    setProcessing(true)
    setProfiles([])
    try {
      const { processDocument } = await import('./intelligence/pipeline')
      const nextProfiles: StructuredDocumentProfile[] = []
      for (const attachment of attachments) {
        setPipeline({ stage: 'parsing', message: `Preparing ${attachment.name}`, progress: 0 })
        nextProfiles.push(await processDocument(attachment.file, prompt, setPipeline))
      }
      setProfiles(nextProfiles)
    } catch (error) {
      setPipeline({ stage: 'error', message: error instanceof Error ? error.message : 'Could not process source file.' })
    } finally {
      setProcessing(false)
    }
  }

  if (savedCanvas) return <CanvasWorkspace initialDocument={savedCanvas} onExit={() => setSavedCanvas(null)} onSaved={setSavedCanvas} />

  return <div className="workspace-page">
    <div className="ambient-line ambient-line--left" /><div className="ambient-line ambient-line--right" />
    <section className="workspace-intro"><p className="eyebrow">Thursday, 03 October 2026 <span>·</span> 14:32</p><h1>Good afternoon, <em>Doctor.</em></h1><p className="intro-copy">What are we working on?</p></section>
    <form className={`prompt-composer ${dragging ? 'prompt-composer--dragging' : ''}`} onSubmit={submit}>
      <div className="composer-top"><span className="composer-kicker"><span className="pulse-dot" /> MEDFOLIO is ready</span><span className="composer-hint">Clinical and academic work, made clearer.</span></div>
      <div className="drop-zone" onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false) }} onDrop={onDrop}>
        {attachments.length > 0 && <div className="attachment-list" aria-label="Attached files">{attachments.map((file) => <div className="attachment" key={file.id}><span className="file-badge">{file.type}</span><span className="attachment-copy"><strong>{file.name}</strong><small>{file.size}</small></span><button type="button" className="remove-file" aria-label={`Remove ${file.name}`} onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}><Icon name="close" size={14} /></button></div>)}</div>}
        <textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setPipeline(null) }} placeholder="Upload a document or tell MEDFOLIO what you want to create..." aria-label="Tell MEDFOLIO what you want to create" rows={3} />
        <div className="composer-actions"><label className="attach-button" tabIndex={0}><Icon name="paperclip" size={17} /><span>Attach sources</span><input ref={fileInput} type="file" multiple accept=".pdf,.docx,.xls,.xlsx,.txt,.csv,image/*" onChange={onFileChange} /></label><span className="drop-hint">or drop files here</span><button className="send-button" type="submit" aria-label="Process sources" disabled={processing}><Icon name={processing ? 'clock' : 'arrow'} size={18} /></button></div>
      </div>
      {pipeline && <PipelineStatus update={pipeline} />}
    </form>
    {profiles.length > 0 && <><ProfileSummary profiles={profiles} /><TemplateSelector profiles={profiles} /></>}
    <div className="suggestions"><span>Try asking</span><button type="button" onClick={() => setPrompt('Turn this paper into a clear grand rounds presentation')}>Turn this paper into a grand rounds presentation <Icon name="arrow-up-right" size={13} /></button><button type="button" onClick={() => setPrompt('Help me shape a systematic review from these sources')}>Shape a systematic review from these sources <Icon name="arrow-up-right" size={13} /></button></div>
  </div>
}

function PipelineStatus({ update }: { update: PipelineUpdate }) {
  const tone = update.stage === 'error' ? ' pipeline-status--error' : update.stage === 'complete' ? ' pipeline-status--complete' : ''
  return <div className={`pipeline-status${tone}`}><span className="pipeline-status-icon"><Icon name={update.stage === 'complete' ? 'check' : update.stage === 'error' ? 'close' : 'clock'} size={15} /></span><span><strong>{update.stage === 'error' ? 'Processing stopped' : update.stage === 'complete' ? 'Document profile ready' : update.stage === 'ocr' ? 'OCR' : update.stage === 'understanding' ? 'Understanding' : 'Parsing'}</strong><small>{update.message}</small></span>{typeof update.progress === 'number' && update.stage !== 'error' && <span className="pipeline-progress">{update.progress}%</span>}</div>
}

function ProfileSummary({ profiles }: { profiles: StructuredDocumentProfile[] }) {
  return <section className="profile-summary" aria-label="Structured document profile"><div className="profile-summary-heading"><div><p className="eyebrow">Structured document profile</p><h2>{profiles.length === 1 ? profiles[0].source.name : `${profiles.length} sources understood`}</h2></div><span className="profile-ready"><Icon name="check" size={13} /> Ready</span></div><div className="profile-facts">{profiles.map((profile) => <div className="profile-fact" key={profile.source.name}><strong>{profile.documentType}</strong><span>{profile.pages.length} pages <i /> {profile.tables.length} tables <i /> {profile.characteristics.hasImages ? 'images found' : 'no images found'}</span>{profile.topics.length > 0 && <small>Topics: {profile.topics.join(', ')}</small>}<small>{profile.provenance.length} provenance records preserved</small></div>)}</div></section>
}

function TemplateSelector({ profiles }: { profiles: StructuredDocumentProfile[] }) {
  const profile = profiles[0]
  const [memory, setMemory] = useState<TemplateMemory>(() => loadTemplateMemory())
  const recommendations = selectTemplates(profile, memory)
  const [selectedId, setSelectedId] = useState(recommendations[0].template.id)
  const [draft, setDraft] = useState<PresentationDraft | null>(null)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const selected = recommendations.find((recommendation) => recommendation.template.id === selectedId) ?? recommendations[0]
  const choose = (recommendation: TemplateRecommendation) => { setSelectedId(recommendation.template.id); setMemory(rememberTemplateSelection(recommendation.template.id)); setDraft(null) }
  const generate = () => { const plan = buildSlidePlan(profile, selected.template); setDraft(generateSlideContent(profile, selected.template, plan)); setCanvasOpen(true) }

  if (canvasOpen && draft) return <CanvasWorkspace initialDocument={canvasFromDraft(draft)} onExit={() => setCanvasOpen(false)} />

  return <><section className="template-selector" aria-label="Template selection"><div className="template-selector-heading"><div><p className="eyebrow">Stage 2 · Template selection</p><h2>Choose a shape for this work</h2><p>Grounded in {profile.documentType.toLowerCase()}, {profile.purpose.toLowerCase()}, and {profile.audience.toLowerCase()}.</p></div><span className="template-memory"><Icon name="bookmark" size={14} /> {memory.preferredTemplateId ? 'Preference saved' : 'Learns your choice'}</span></div><div className="template-selection-layout"><div className="template-list">{recommendations.map((recommendation, index) => <button type="button" className={`template-card ${selected.template.id === recommendation.template.id ? 'template-card--selected' : ''}`} key={recommendation.template.id} onClick={() => choose(recommendation)}><span className="template-card-number">{String(index + 1).padStart(2, '0')}</span><span className="template-card-copy"><strong>{recommendation.template.name}</strong><small>{recommendation.template.description}</small><span className="template-reasons">{recommendation.reasons.slice(0, 2).join(' · ')}</span></span><span className="template-score">{recommendation.score}</span></button>)}</div><div className="template-preview"><div className="template-preview-top"><span className="preview-label">Preview schema</span><span className="preview-audience">{selected.template.audience}</span></div><h3>{selected.template.name}</h3><p>{selected.template.schema.tone}</p><div className="schema-slots">{selected.template.schema.contentSlots.map((slot, index) => <div className="schema-slot" key={slot}><span>0{index + 1}</span>{slot}</div>)}</div><div className="why-template"><strong>Why this match</strong><ul>{selected.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div><button type="button" className="select-template-button" onClick={generate}><Icon name="spark" size={15} /> Open live canvas</button></div></div></section>{draft && <PresentationReview draft={draft} onOpenCanvas={() => setCanvasOpen(true)} />}</>
}

function PresentationReview({ draft, onOpenCanvas }: { draft: PresentationDraft; onOpenCanvas: () => void }) {
  return <section className="presentation-review" aria-label="Slide plan and generated content"><div className="presentation-heading"><div><p className="eyebrow">Stage 3 · Slide planning and content</p><h2>{draft.template.name} draft</h2><p>Grounded draft. Review source links before any presentation design begins.</p></div><span className="draft-badge"><Icon name="check" size={13} /> {draft.plan.slideCount} slides validated</span></div><button className="select-template-button review-canvas-button" onClick={onOpenCanvas}><Icon name="spark" size={15} /> Open live canvas</button><div className="plan-strip">{draft.plan.slides.map((slide) => <div className="plan-item" key={slide.id}><span>{String(slide.order).padStart(2, '0')}</span><strong>{slide.title}</strong><small>{slide.visualizationType}</small></div>)}</div><div className="slide-content-list">{draft.content.map((slide) => <article className="slide-content-card" key={slide.slideId}><div className="slide-content-heading"><span className="slide-number">{String(slide.order).padStart(2, '0')}</span><div><h3>{slide.title}</h3><span>{draft.plan.slides[slide.order - 1]?.purpose}</span></div><small>{draft.plan.slides[slide.order - 1]?.visualizationType}</small></div>{slide.body.length > 0 && <div className="grounded-block"><label>Body</label>{slide.body.map((item) => <p key={item.text}>{item.text}<ProvenanceLine sources={item.provenance} /></p>)}</div>}{slide.keyFindings.length > 0 && <div className="grounded-block"><label>Key findings</label>{slide.keyFindings.map((item) => <p key={item.text}>{item.text}<ProvenanceLine sources={item.provenance} /></p>)}</div>}{slide.metrics.length > 0 && <div className="metric-list"><label>Source metrics</label>{slide.metrics.map((metric) => <span key={`${metric.label}-${metric.value}`}><strong>{metric.value}</strong> {metric.label}<ProvenanceLine sources={metric.provenance} /></span>)}</div>}{slide.tables.map((table) => <div className="generated-table" key={table.provenance[0]?.sourceFile}><label>Extracted table</label><table><thead><tr>{table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table><ProvenanceLine sources={table.provenance} /></div>)}{slide.charts.map((chart) => <div className="chart-spec" key={chart.title}><label>{chart.type} chart specification</label><strong>{chart.title}</strong><span>Labels: {chart.labels.join(', ')}</span><span>Values: {chart.values.join(', ')}</span><ProvenanceLine sources={chart.provenance} /></div>)}{slide.imageRequirements.map((item) => <div className="image-requirement" key={item.text}>{item.text}<ProvenanceLine sources={item.provenance} /></div>)}<div className="reference-row"><label>Sources</label><ProvenanceLine sources={slide.references} /></div></article>)}</div></section>
}

function ProvenanceLine({ sources }: { sources: PresentationDraft['profile']['provenance'] }) {
  return <small className="provenance-line">{sources.length ? sources.map((source) => `${source.sourceFile}${source.pageNumber ? ` · p.${source.pageNumber}` : ''}${source.sheetName ? ` · ${source.sheetName}` : ''}`).join(' | ') : 'No source location recorded'}</small>
}

function formatFileSize(bytes: number) { if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB` }

function PlaceholderPage({ route, onNavigate }: { route: Route; onNavigate: (route: Route) => void }) {
  return <div className="placeholder-page"><div className="placeholder-icon"><Icon name={route === 'project' ? 'spark' : 'folder'} size={23} /></div><p className="eyebrow">{routeLabels[route]}</p><h1>{route === 'project' ? 'Project workspace' : routeLabels[route]}</h1><p className="lede">This foundation is ready for the next MEDFOLIO workflow stage.</p><button className="primary-button" onClick={() => onNavigate('home')}><Icon name="arrow-left" size={16} /> Back to workspace</button></div>
}

export default App
