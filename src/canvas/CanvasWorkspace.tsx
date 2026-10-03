import { useState } from 'react'
import { Icon } from '../components/Icon'
import { exportCanvasToPptx } from '../export/pptx'
import { addBlankSlide, addElement, deleteSlide, duplicateSlide, moveSlide, updateElement } from './model'
import { saveCanvas } from './storage'
import type { CanvasDocument, CanvasElement, CanvasSlide } from './types'

type Props = { initialDocument: CanvasDocument; onExit: () => void; onSaved?: (document: CanvasDocument) => void }
type History = { past: CanvasDocument[]; present: CanvasDocument; future: CanvasDocument[] }

export function CanvasWorkspace({ initialDocument, onExit, onSaved }: Props) {
  const [history, setHistory] = useState<History>({ past: [], present: initialDocument, future: [] })
  const [selectedSlideId, setSelectedSlideId] = useState(initialDocument.slides[0]?.id ?? '')
  const [savedAt, setSavedAt] = useState(initialDocument.savedAt)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const document = history.present
  const selectedSlide = document.slides.find((slide) => slide.id === selectedSlideId) ?? document.slides[0]

  const commit = (next: CanvasDocument) => setHistory((current) => ({ past: [...current.past, current.present].slice(-50), present: next, future: [] }))
  const update = (next: CanvasDocument) => { commit(next); setSavedAt('') }
  const undo = () => setHistory((current) => { const previous = current.past.at(-1); return previous ? { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] } : current })
  const redo = () => setHistory((current) => { const next = current.future[0]; return next ? { past: [...current.past, current.present], present: next, future: current.future.slice(1) } : current })
  const save = () => { const saved = saveCanvas(document); setHistory((current) => ({ ...current, present: saved })); setSavedAt(saved.savedAt); onSaved?.(saved) }
  const downloadPptx = async () => { setExporting(true); setExportError(''); try { await exportCanvasToPptx(document) } catch (error) { setExportError(error instanceof Error ? error.message : 'PPTX export failed.') } finally { setExporting(false) } }
  const addSlide = () => { const next = addBlankSlide(document); update(next); setSelectedSlideId(next.slides.at(-1)?.id ?? '') }
  const duplicate = () => { if (!selectedSlide) return; const next = duplicateSlide(document, selectedSlide.id); update(next); setSelectedSlideId(next.slides.find((slide) => slide.order === selectedSlide.order + 1)?.id ?? selectedSlide.id) }
  const remove = () => { if (!selectedSlide) return; const next = deleteSlide(document, selectedSlide.id); update(next); setSelectedSlideId(next.slides[Math.max(0, selectedSlide.order - 2)]?.id ?? next.slides[0].id) }
  const reorder = (direction: -1 | 1) => { if (!selectedSlide) return; const next = moveSlide(document, selectedSlide.id, direction); update(next) }

  return <div className="canvas-workspace">
    <header className="canvas-toolbar"><div className="canvas-title-group"><button className="canvas-back" onClick={onExit} aria-label="Back to draft"><Icon name="arrow-left" size={17} /></button><div><strong>{document.title}</strong><span>{document.templateName} · {document.slides.length} slides</span></div></div><div className="canvas-actions"><span className={`edit-state ${savedAt ? 'edit-state--saved' : ''}`}><span /> {exportError || (savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }` : 'Unsaved changes')}</span><button className="canvas-icon-button" onClick={undo} disabled={!history.past.length} aria-label="Undo"><Icon name="undo" size={16} /></button><button className="canvas-icon-button" onClick={redo} disabled={!history.future.length} aria-label="Redo"><Icon name="redo" size={16} /></button><button className="canvas-save" onClick={save}><Icon name="save" size={15} /> Save</button><button className="canvas-export" onClick={downloadPptx} disabled={exporting}><Icon name="download" size={15} /> {exporting ? 'Preparing...' : 'Download PPTX'}</button></div></header>
    <div className="canvas-body"><aside className="slide-rail"><div className="rail-heading"><span>Slides</span><strong>{String(document.slides.length).padStart(2, '0')}</strong></div><div className="thumbnail-list">{document.slides.map((slide) => <button type="button" className={`slide-thumbnail ${slide.id === selectedSlide?.id ? 'slide-thumbnail--selected' : ''}`} key={slide.id} onClick={() => setSelectedSlideId(slide.id)}><span className="thumbnail-number">{String(slide.order).padStart(2, '0')}</span><span className="thumbnail-paper"><strong>{slide.elements.find((element) => element.kind === 'text')?.text || 'Untitled slide'}</strong><small>{slide.elements.length} elements</small></span></button>)}</div><div className="rail-actions"><button onClick={addSlide}><Icon name="plus" size={14} /> Add slide</button><button onClick={duplicate}><Icon name="copy" size={14} /> Duplicate</button></div></aside><main className="canvas-main"><div className="canvas-mainbar"><span><span className="generated-dot" /> Generated content <span className="edited-dot" /> User edits</span><div><button className="small-action" onClick={() => reorder(-1)} disabled={!selectedSlide || selectedSlide.order === 1} aria-label="Move slide up"><Icon name="chevron-up" size={14} /></button><button className="small-action" onClick={() => reorder(1)} disabled={!selectedSlide || selectedSlide.order === document.slides.length} aria-label="Move slide down"><Icon name="chevron-down" size={14} /></button><button className="small-action small-action--danger" onClick={remove} disabled={document.slides.length <= 1} aria-label="Delete slide"><Icon name="trash" size={14} /></button></div></div>{selectedSlide && <SlideCanvas slide={selectedSlide} onUpdate={(elementId, patch) => update(updateElement(document, selectedSlide.id, elementId, patch))} onAddElement={(kind) => update(addElement(document, selectedSlide.id, kind))} />}</main></div>
  </div>
}

function SlideCanvas({ slide, onUpdate, onAddElement }: { slide: CanvasSlide; onUpdate: (elementId: string, patch: Partial<CanvasElement>) => void; onAddElement: (kind: CanvasElement['kind']) => void }) {
  const [title, ...elements] = slide.elements
  return <section className="slide-stage-wrap"><div className="slide-stage"><div className="slide-stage-label">{slide.order.toString().padStart(2, '0')} / {slide.elements.length} editable elements</div>{title && <EditableText element={title} className="slide-stage-title" onChange={(text) => onUpdate(title.id, { text })} />}{elements.map((element) => <CanvasElementView element={element} key={element.id} onUpdate={onUpdate} />)}<div className="element-adder"><span>Add to slide</span><button onClick={() => onAddElement('text')}>Text</button><button onClick={() => onAddElement('metric')}>Metric</button><button onClick={() => onAddElement('table')}>Table</button><button onClick={() => onAddElement('chart')}>Chart</button><button onClick={() => onAddElement('image')}>Image</button></div></div></section>
}

function EditableText({ element, className, onChange }: { element: CanvasElement; className?: string; onChange: (text: string) => void }) {
  return <div className={`canvas-text-element ${className ?? ''}`}><EditableBadge element={element} /><textarea value={element.text} onChange={(event) => onChange(event.target.value)} aria-label="Editable text" rows={element.text.length > 100 ? 4 : 2} /></div>
}

function CanvasElementView({ element, onUpdate }: { element: CanvasElement; onUpdate: (elementId: string, patch: Partial<CanvasElement>) => void }) {
  if (element.kind === 'text') return <EditableText element={element} onChange={(text) => onUpdate(element.id, { text })} />
  if (element.kind === 'metric') return <div className="canvas-metric-element"><EditableBadge element={element} /><input value={element.metric?.value ?? ''} onChange={(event) => onUpdate(element.id, { text: `${event.target.value} ${element.metric?.label ?? ''}`, metric: { label: element.metric?.label ?? 'Metric', value: event.target.value } })} aria-label="Metric value" /><input value={element.metric?.label ?? ''} onChange={(event) => onUpdate(element.id, { text: `${element.metric?.value ?? ''} ${event.target.value}`, metric: { label: event.target.value, value: element.metric?.value ?? '' } })} aria-label="Metric label" /></div>
  if (element.kind === 'table' && element.table) return <EditableTable element={element} onUpdate={onUpdate} />
  if (element.kind === 'chart' && element.chart) return <EditableChart element={element} onUpdate={onUpdate} />
  return <div className="canvas-image-element"><EditableBadge element={element} /><Icon name="image" size={24} /><EditableText element={element} onChange={(text) => onUpdate(element.id, { text })} /></div>
}

function EditableTable({ element, onUpdate }: { element: CanvasElement; onUpdate: (elementId: string, patch: Partial<CanvasElement>) => void }) {
  const table = element.table!
  const updateCell = (rowIndex: number, columnIndex: number, value: string, header: boolean) => { const next = { ...table, headers: [...table.headers], rows: table.rows.map((row) => [...row]) }; if (header) next.headers[columnIndex] = value; else next.rows[rowIndex][columnIndex] = value; onUpdate(element.id, { table: next }) }
  return <div className="canvas-table-element"><EditableBadge element={element} /><table><thead><tr>{table.headers.map((header, index) => <th key={index}><input value={header} onChange={(event) => updateCell(0, index, event.target.value, true)} /></th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={columnIndex}><input value={cell} onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value, false)} /></td>)}</tr>)}</tbody></table><ProvenanceText sources={element.provenance} /></div>
}

function EditableChart({ element, onUpdate }: { element: CanvasElement; onUpdate: (elementId: string, patch: Partial<CanvasElement>) => void }) {
  const chart = element.chart!
  const updateChart = (patch: Partial<typeof chart>) => onUpdate(element.id, { chart: { ...chart, ...patch } })
  return <div className="canvas-chart-element"><EditableBadge element={element} /><input className="chart-title-input" value={chart.title} onChange={(event) => updateChart({ title: event.target.value })} aria-label="Chart title" /><div className="chart-bars">{chart.values.map((value, index) => <div className="chart-bar-item" key={index}><span style={{ height: `${Math.min(100, Math.max(8, Number(value) || 8))}%` }} /><input value={chart.labels[index] ?? ''} onChange={(event) => updateChart({ labels: chart.labels.map((label, labelIndex) => labelIndex === index ? event.target.value : label) })} aria-label="Chart label" /><input value={value} onChange={(event) => updateChart({ values: chart.values.map((entry, entryIndex) => entryIndex === index ? event.target.value : entry) })} aria-label="Chart value" /></div>)}</div><ProvenanceText sources={element.provenance} /></div>
}

function EditableBadge({ element }: { element: CanvasElement }) { return <span className={`element-badge ${element.edited ? 'element-badge--edited' : ''}`}><span /> {element.edited ? 'Edited' : 'Generated'}</span> }
function ProvenanceText({ sources }: { sources: CanvasElement['provenance'] }) { return <small className="canvas-provenance">{sources.length ? sources.map((source) => `${source.sourceFile}${source.pageNumber ? ` · p.${source.pageNumber}` : ''}${source.sheetName ? ` · ${source.sheetName}` : ''}`).join(' | ') : 'User-created element'}</small> }
