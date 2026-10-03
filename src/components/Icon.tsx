type IconName = 'arrow' | 'arrow-left' | 'arrow-up-right' | 'bell' | 'bookmark' | 'check' | 'chevron' | 'chevron-down' | 'chevron-up' | 'clock' | 'close' | 'copy' | 'download' | 'file' | 'folder' | 'help' | 'image' | 'menu' | 'paperclip' | 'plus' | 'redo' | 'save' | 'search' | 'settings' | 'spark' | 'trash' | 'undo'

const paths: Record<IconName, string> = {
  arrow: 'M4 12h15m-6-6 6 6-6 6', 'arrow-left': 'M20 12H5m6 6-6-6 6-6', 'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', bookmark: 'M6 3h12v18l-6-4-6 4Z', check: 'm5 12 4 4L19 6', chevron: 'm9 18 6-6-6-6', 'chevron-down': 'm6 9 6 6 6-6', 'chevron-up': 'm18 15-6-6-6 6',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', close: 'm6 6 12 12M18 6 6 18',
  copy: 'M8 8h11v12H8zM5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1', download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14', file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 17h8M8 13h2', folder: 'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  help: 'M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4m.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', menu: 'M4 6h16M4 12h16M4 18h16',
  image: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm3 12 3-3 2 2 3-4 3 5M8 8h.01', paperclip: 'm21.4 11.6-8.7 8.7a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.3-8.3', plus: 'M12 5v14M5 12h14', redo: 'm9 14 5-5 5 5M14 9v8', save: 'M5 3h12l3 3v15H4V3Zm3 0v5h8V3M8 21v-8h8v8', search: 'm21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6.7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0-1.5 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.5 1Z', spark: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Zm6 12 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7Z', trash: 'M5 7h14m-9 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14', undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v1',
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d={paths[name]} /></svg>
}
