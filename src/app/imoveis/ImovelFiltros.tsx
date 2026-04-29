'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import MultiSelect, { MSOption } from '@/components/MultiSelect/MultiSelect'
import styles from './imoveis.module.css'

const TIPO_OPTIONS: MSOption[] = [
  { label: 'Apartamento', value: 'apartamento' },
  { label: 'Casa',        value: 'casa' },
  { label: 'Terreno',     value: 'terreno' },
  { label: 'Comercial',   value: 'comercial' },
]

const SITUACAO_OPTIONS: MSOption[] = [
  { label: 'Construção', value: 'construcao' },
  { label: 'Novo',       value: 'novo' },
  { label: 'Planta',     value: 'planta' },
  { label: 'Usado',      value: 'usado' },
]

const FINALIDADES = [
  { label: 'Venda',   value: 'venda' },
  { label: 'Aluguel', value: 'aluguel' },
]

const QUARTOS_LIST = [
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
]

interface Props { bairros: string[] }

export default function ImovelFiltros({ bairros }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback((key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    value ? current.set(key, value) : current.delete(key)
    const qs = current.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [searchParams, pathname, router])

  const [precoMin, setPrecoMin] = useState(searchParams.get('preco_min') ?? '')
  const [precoMax, setPrecoMax] = useState(searchParams.get('preco_max') ?? '')

  useEffect(() => {
    setPrecoMin(searchParams.get('preco_min') ?? '')
    setPrecoMax(searchParams.get('preco_max') ?? '')
  }, [searchParams])

  const bairroOptions: MSOption[] = bairros.map(b => ({ label: b, value: b }))

  const isActive = (key: string, value: string) =>
    (searchParams.get(key) ?? '') === value

  return (
    <div className={styles.filtros}>
      {/* Row 1: MultiSelects */}
      <div className={styles.filtroRowGrid}>
        <MultiSelect
          label="Tipo"
          options={TIPO_OPTIONS}
          value={searchParams.get('tipo') ?? ''}
          onChange={v => setParam('tipo', v)}
          placeholder="Todos os tipos"
        />
        <MultiSelect
          label="Bairro"
          options={bairroOptions}
          value={searchParams.get('bairro') ?? ''}
          onChange={v => setParam('bairro', v)}
          placeholder="Todos os bairros"
        />
        <MultiSelect
          label="Situação"
          options={SITUACAO_OPTIONS}
          value={searchParams.get('situacao') ?? ''}
          onChange={v => setParam('situacao', v)}
          placeholder="Qualquer situação"
        />
      </div>

      {/* Row 2: button groups + price inputs */}
      <div className={styles.filtroRow}>
        <div className={styles.filtroGroup}>
          <span className={styles.filtroLabel}>Finalidade</span>
          <div className={styles.filtroOpcoes}>
            {FINALIDADES.map(f => (
              <button
                key={f.value}
                className={`${styles.filtroBtn} ${isActive('finalidade', f.value) ? styles.filtroBtnAtivo : ''}`}
                onClick={() => setParam('finalidade', isActive('finalidade', f.value) ? '' : f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filtroGroup}>
          <span className={styles.filtroLabel}>Quartos</span>
          <div className={styles.filtroOpcoes}>
            {QUARTOS_LIST.map(q => (
              <button
                key={q.value}
                className={`${styles.filtroBtn} ${isActive('quartos', q.value) ? styles.filtroBtnAtivo : ''}`}
                onClick={() => setParam('quartos', isActive('quartos', q.value) ? '' : q.value)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filtroGroup}>
          <span className={styles.filtroLabel}>Valor mínimo</span>
          <input
            type="number"
            className={styles.filtroInput}
            placeholder="R$ mínimo"
            value={precoMin}
            onChange={e => setPrecoMin(e.target.value)}
            onBlur={() => setParam('preco_min', precoMin)}
            min="0"
          />
        </div>

        <div className={styles.filtroGroup}>
          <span className={styles.filtroLabel}>Valor máximo</span>
          <input
            type="number"
            className={styles.filtroInput}
            placeholder="R$ máximo"
            value={precoMax}
            onChange={e => setPrecoMax(e.target.value)}
            onBlur={() => setParam('preco_max', precoMax)}
            min="0"
          />
        </div>
      </div>
    </div>
  )
}
