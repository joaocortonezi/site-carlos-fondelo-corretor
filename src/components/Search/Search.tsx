'use client'

import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { motion }     from 'framer-motion'
import MultiSelect    from '@/components/MultiSelect/MultiSelect'
import styles         from './Search.module.css'

const TIPO_OPTIONS = [
  { label: 'Apartamento', value: 'apartamento' },
  { label: 'Casa',        value: 'casa' },
  { label: 'Terreno',     value: 'terreno' },
  { label: 'Comercial',   value: 'comercial' },
]

const SITUACAO_OPTIONS = [
  { label: 'Construção', value: 'construcao' },
  { label: 'Novo',       value: 'novo' },
  { label: 'Planta',     value: 'planta' },
  { label: 'Usado',      value: 'usado' },
]

const QUARTOS_OPTIONS = [
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
]

interface Props { bairros?: string[] }

export default function Search({ bairros = [] }: Props) {
  const router = useRouter()

  const [tipo,     setTipo]     = useState('')
  const [bairro,   setBairro]   = useState('')
  const [situacao, setSituacao] = useState('')
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [quartos,  setQuartos]  = useState('')

  const bairroOptions = bairros.map(b => ({ label: b, value: b }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (tipo)     params.set('tipo',      tipo)
    if (bairro)   params.set('bairro',    bairro)
    if (situacao) params.set('situacao',  situacao)
    if (precoMin) params.set('preco_min', precoMin)
    if (precoMax) params.set('preco_max', precoMax)
    if (quartos)  params.set('quartos',   quartos)
    const qs = params.toString()
    router.push(qs ? `/imoveis?${qs}` : '/imoveis')
  }

  return (
    <motion.section
      className={styles.section}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="container">
        <p className={styles.title}>Buscar Imóvel</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row1}>
            <MultiSelect
              label="Tipo"
              options={TIPO_OPTIONS}
              value={tipo}
              onChange={setTipo}
              placeholder="Todos os tipos"
            />
            <MultiSelect
              label="Bairro"
              options={bairroOptions}
              value={bairro}
              onChange={setBairro}
              placeholder="Todos os bairros"
            />
            <MultiSelect
              label="Situação"
              options={SITUACAO_OPTIONS}
              value={situacao}
              onChange={setSituacao}
              placeholder="Qualquer situação"
            />
            <motion.button
              type="submit"
              className={styles.btnSearch}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              Buscar Imóveis
            </motion.button>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Valor mínimo</label>
              <input
                type="number"
                className={styles.input}
                placeholder="R$ mínimo"
                value={precoMin}
                onChange={e => setPrecoMin(e.target.value)}
                min="0"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Valor máximo</label>
              <input
                type="number"
                className={styles.input}
                placeholder="R$ máximo"
                value={precoMax}
                onChange={e => setPrecoMax(e.target.value)}
                min="0"
              />
            </div>
            <div className={styles.fieldQuartos}>
              <span className={styles.label}>Quartos</span>
              <div className={styles.quartosGroup}>
                {QUARTOS_OPTIONS.map(q => (
                  <button
                    key={q.value}
                    type="button"
                    className={`${styles.quartosBtn} ${quartos === q.value ? styles.quartosBtnActive : ''}`}
                    onClick={() => setQuartos(prev => prev === q.value ? '' : q.value)}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </motion.section>
  )
}
