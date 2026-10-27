import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  onClose?: () => void
}

/** Diálogo modal: foco al primer botón al abrir, Escape cierra si hay `onClose`. */
export function Dialog({ title, children, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    return () => prev?.focus?.()
  }, [])

  return (
    <div
      className="backdrop"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onClose) onClose()
        e.stopPropagation()
      }}
    >
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
