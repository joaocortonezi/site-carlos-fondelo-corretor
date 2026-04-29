'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './MultiSelect.module.css'

export interface MSOption { label: string; value: string }

interface Props {
  label:       string
  options:     MSOption[]
  value:       string        // comma-separated
  onChange:    (v: string) => void
  placeholder?: string
}

export default function MultiSelect({ label, options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)

  const selected = value ? value.split(',').filter(Boolean) : []

  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val]
    onChange(next.join(','))
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayText =
    selected.length === 0 ? (placeholder ?? `Todos`)
    : selected.length === 1 ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
    : `${selected.length} selecionados`

  return (
    <div ref={ref} className={styles.wrap}>
      <span className={styles.fieldLabel}>{label}</span>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ''} ${selected.length > 0 ? styles.active : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.triggerText}>{displayText}</span>
        <svg className={`${styles.chevron} ${open ? styles.chevronUp : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {options.map(opt => (
            <label key={opt.value} className={`${styles.option} ${selected.includes(opt.value) ? styles.optionChecked : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className={styles.checkbox}
              />
              {opt.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" className={styles.limpar} onClick={() => onChange('')}>
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  )
}
