/* ============================================================================
 * CoinFlip.tsx — ESCENA ÚNICA · CARA O SELLO
 * ----------------------------------------------------------------------------
 * Coreografía del lanzamiento (framer-motion):
 *   impulso (0,55 s) → giro 3–5 vueltas con cara aleatoria → caída acelerada
 *   → impacto (squash + chispas + onda + clink) → micro-rebote → asentamiento.
 * El resultado usa crypto.getRandomValues (ver src/lib/coins.ts#tirarMoneda).
 * El sonido se sintetiza con WebAudio (src/lib/sound.ts), sin archivos.
 * ==========================================================================*/
import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence, motion, useAnimationControls, useMotionValue, useSpring, useTransform,
} from 'framer-motion'
import { Coins, RotateCcw, Volume2, VolumeX, Zap } from 'lucide-react'
import Coin from '@/components/Coin'
import { COINS, tirarMoneda } from '@/lib/coins'
import type { CoinSkin, CaraOSello } from '@/lib/coins'
import { whoosh, clink, tick, setMuted as setSfxMuted } from '@/lib/sound'
import { cn } from '@/utils/cn'

/** Float 0–1 con RNG criptográfico (decisiones de física y resultado). */
const rand = () => {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return (b[0] ?? 0) / 4294967295
}
const mod360 = (v: number) => ((v % 360) + 360) % 360

const COIN_CLS = 'size-[min(70vw,290px)]'

interface Spark { id: number; ang: number; dist: number; size: number; dur: number }

export default function CoinFlip() {
  /* ------------------------------- estado ------------------------------- */
  const [skin, setSkin] = useState<CoinSkin>(COINS[1]) // EUR por defecto: muy fotogénico
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<CaraOSello | null>(null)
  const [resultId, setResultId] = useState(0)
  const [lanzamientos, setLanzamientos] = useState(0)
  const [counts, setCounts] = useState({ cara: 0, sello: 0 })
  const [racha, setRacha] = useState<{ face: CaraOSello; n: number }>({ face: 'cara', n: 0 })
  const [history, setHistory] = useState<('C' | 'S')[]>([])
  const [sparks, setSparks] = useState<Spark[]>([])
  const [ring, setRing] = useState(0)
  const [muted, setMutedState] = useState(false)

  const flippingRef = useRef(false)
  const rotRef = useRef(0) // rotateY acumulado: el giro siempre continúa, nunca "retrocede"

  /* ---------------------------- controles de animación ------------------ */
  const jumpCtrls = useAnimationControls()   // subida / caída / squash
  const floatCtrls = useAnimationControls()  // flotación en reposo
  const tiltCtrls = useAnimationControls()   // rotateZ (balanceo + inclinación final)
  const rotCtrls = useAnimationControls()    // rotateY (vueltas) + rotateX (tumble)
  const shadowCtrls = useAnimationControls() // sombra proyectada

  /** Bucle de reposo: la moneda "respira" sobre la mesa. */
  const startIdle = (tiltBase = 0) => {
    void floatCtrls.start({ y: [0, -9, 0], transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } })
    void tiltCtrls.start({ rotateZ: [tiltBase - 1.5, tiltBase + 1.5, tiltBase - 1.5], transition: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' } })
    void shadowCtrls.start({
      scaleX: [1, 0.9, 1], opacity: [0.5, 0.36, 0.5],
      transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
    })
  }
  useEffect(() => { startIdle() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------ parallax 3D --------------------------- */
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 55, damping: 16 })
  const sy = useSpring(my, { stiffness: 55, damping: 16 })
  const pRotX = useTransform(sy, [-0.5, 0.5], [7, -7])
  const pRotY = useTransform(sx, [-0.5, 0.5], [-10, 10])

  /* ------------------------------- lanzamiento -------------------------- */
  const flip = async () => {
    if (flippingRef.current) return
    flippingRef.current = true
    setFlipping(true)
    setResult(null)
    floatCtrls.stop(); shadowCtrls.stop(); tiltCtrls.stop()
    mx.set(0); my.set(0)

    const res = tirarMoneda()                                 // ← el azar manda aquí
    const spins = 3 + Math.floor(rand() * 3)                  // 3–5 vueltas completas
    const caraAngulo = res === 'sello' ? 180 : 0
    const delta = ((caraAngulo - mod360(rotRef.current)) + 360) % 360
    const target = rotRef.current + spins * 360 + delta
    rotRef.current = target

    whoosh()
    // El giro cubre todo el vuelo; el tumble (rotateX) decae al aterrizar
    void rotCtrls.start({
      rotateY: target,
      rotateX: [0, 26, -17, 10, -5, 0],
      transition: { duration: 1.06, times: [0, 0.32, 0.52, 0.72, 0.88, 1], ease: 'easeOut' },
    })
    void tiltCtrls.start({ rotateZ: 0, transition: { duration: 0.2 } })

    // 1) Impulso: sube decelerando, se acerca a cámara, la sombra enflaquece
    await Promise.all([
      jumpCtrls.start({ y: '-46vh', scale: 1.16, transition: { duration: 0.56, ease: [0.16, 0.84, 0.3, 1] } }),
      shadowCtrls.start({ scale: 0.5, opacity: 0.28, transition: { duration: 0.56, ease: 'easeOut' } }),
    ])
    // 2) Caída: gravedad acelerando
    await Promise.all([
      jumpCtrls.start({ y: '0vh', scale: 1, transition: { duration: 0.5, ease: [0.62, 0, 1, 0.44] } }),
      shadowCtrls.start({ scale: 1, opacity: 0.55, transition: { duration: 0.5, ease: 'easeIn' } }),
    ])

    // 3) Impacto: sonido, chispas, onda expansiva, squash elástico
    clink(1)
    explotar()
    setRing((r) => r + 1)
    void shadowCtrls.start({ scale: [1.16, 1], opacity: [0.72, 0.55], transition: { duration: 0.42 } })
    await jumpCtrls.start({ scaleY: 0.85, scaleX: 1.09, transition: { duration: 0.09, ease: 'easeOut' } })
    void jumpCtrls.start({ scaleY: 1, scaleX: 1, transition: { type: 'spring', stiffness: 430, damping: 13 } })

    const id = resultId + 1
    setResultId(id)
    setResult(res)
    setLanzamientos((n) => n + 1)
    setCounts((c) => ({ ...c, [res]: c[res] + 1 }))
    setRacha((r) => (r.face === res ? { face: res, n: r.n + 1 } : { face: res, n: 1 }))
    setHistory((h) => [...h.slice(-13), res === 'cara' ? 'C' : 'S'])

    // 4) Micro-rebote orgánico y asentamiento con inclinación aleatoria
    await jumpCtrls.start({ y: '-5.5vh', transition: { duration: 0.15, ease: 'easeOut' } })
    await jumpCtrls.start({ y: '0vh', transition: { duration: 0.18, ease: 'easeIn' } })
    clink(0.4)
    const tilt = (rand() * 2 - 1) * 8
    await tiltCtrls.start({ rotateZ: tilt, transition: { duration: 0.25 } })

    startIdle(tilt)
    flippingRef.current = false
    setFlipping(false)
  }

  /** Lluvia de chispas doradas en el punto de impacto. */
  const explotar = () => {
    const n = 14
    setSparks(
      [...Array(n)].map((_, i) => ({
        id: Date.now() + i,
        ang: (i / n) * Math.PI * 2 + rand() * 0.6,
        dist: 60 + rand() * 110,
        size: 2 + rand() * 4,
        dur: 0.45 + rand() * 0.4,
      })),
    )
    setTimeout(() => setSparks([]), 950)
  }

  /* ------------------------------ atajos de teclado ---------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault()
        void flip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* --------------------------------- helpers UI -------------------------- */
  const total = counts.cara + counts.sello
  const pctCara = total ? Math.round((counts.cara / total) * 100) : 50
  const pctSello = 100 - pctCara

  const elegirSkin = (c: CoinSkin) => {
    if (flippingRef.current || c.id === skin.id) return
    tick()
    setSkin(c)
  }

  const resetStats = () => {
    tick()
    setCounts({ cara: 0, sello: 0 })
    setHistory([]); setRacha({ face: 'cara', n: 0 }); setLanzamientos(0)
  }

  const toggleMute = () => {
    const m = !muted
    setMutedState(m); setSfxMuted(m)
    if (!m) tick()
  }

  /* ================================== UI ================================== */
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(65%_55%_at_50%_38%,#16181D_0%,#0B0C0F_58%,#07080A_100%)] select-none [perspective:1100px]"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-[60] bg-grain" />

      {/* ============================ HEADER ============================ */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-5 md:p-7">
        <div className="flex items-center gap-3">
          <Coins className="size-4 text-gold" />
          <span className="font-numi text-sm font-bold tracking-[0.34em] text-paper">CARA O SELLO</span>
          <span className="hidden h-px w-8 bg-edge2 sm:block" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-fog sm:block">lanzador infinito</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-btn" onClick={toggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button className="icon-btn" onClick={resetStats} aria-label="Reiniciar estadísticas">
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>

      {/* ===================== PALABRA-RESULTADO GIGANTE ===================== */}
      <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={resultId}
              initial={{ opacity: 0, scale: 0.85, filter: 'blur(18px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(12px)', transition: { duration: 0.25 } }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <span className="mb-2 font-mono text-[10px] uppercase tracking-[0.5em] text-gold">
                lanzamiento #{String(lanzamientos).padStart(3, '0')}
              </span>
              <h1 className="txt-result font-display text-[clamp(4.2rem,19vw,15rem)] font-black uppercase leading-none tracking-tight">
                {result}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================ ESCENARIO ============================ */}
      <main className="absolute inset-0 z-10 grid place-items-center pb-[13vh]">
        <div className="relative">
          {/* Parallax con el ratón (solo en reposo visualmente) */}
          <motion.div style={{ rotateX: pRotX, rotateY: pRotY, transformStyle: 'preserve-3d' }}>
            <motion.div animate={jumpCtrls} className="[transform-style:preserve-3d]">
              <motion.div animate={floatCtrls} className="[transform-style:preserve-3d]">
                <motion.div animate={tiltCtrls} className="[transform-style:preserve-3d]">
                  <motion.div animate={rotCtrls} className="[transform-style:preserve-3d]">
                    <button
                      onClick={() => void flip()}
                      disabled={flipping}
                      aria-label="Lanzar la moneda"
                      className={cn('relative block rounded-full transition-[filter] duration-300', COIN_CLS, flipping ? 'cursor-wait' : 'cursor-pointer hover:brightness-110')}
                      style={{ filter: 'drop-shadow(0 22px 44px rgba(0,0,0,0.55))' }}
                    >
                      <Coin skin={skin} />
                      {/* destello de estudio */}
                      <span className="glint pointer-events-none absolute inset-0 rounded-full" />
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Chispas del impacto */}
          {sparks.map((s) => (
            <motion.span
              key={s.id}
              className="absolute left-1/2 top-1/2 rounded-full bg-gold"
              style={{ width: s.size, height: s.size }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(s.ang) * s.dist,
                y: Math.sin(s.ang) * s.dist,
                opacity: 0, scale: 0.2,
              }}
              transition={{ duration: s.dur, ease: 'easeOut' }}
            />
          ))}

          {/* Onda expansiva */}
          <AnimatePresence>
            {ring > 0 && (
              <motion.span
                key={ring}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold/50"
                style={{ width: 'min(70vw,290px)', height: 'min(70vw,290px)' }}
                initial={{ scale: 0.75, opacity: 0.8 }}
                animate={{ scale: 1.55, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Sombra proyectada */}
          <motion.div
            animate={shadowCtrls}
            className="absolute left-1/2 -translate-x-1/2 rounded-[100%] bg-black blur-md"
            style={{ width: 'min(48vw,190px)', height: 26, marginTop: 'calc(min(70vw,290px) / 2 + 22px)' }}
          />
          <p className="absolute left-1/2 w-max -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-fog/60" style={{ marginTop: 'calc(min(70vw,290px) / 2 + 62px)' }}>
            {lanzamientos === 0 ? 'clic en la moneda · espacio' : `${skin.nombre}`}
          </p>
        </div>
      </main>

      {/* ========================= ZONA INFERIOR ========================= */}
      <footer className="absolute inset-x-0 bottom-0 z-30 px-4 pb-5 md:px-8 md:pb-7">
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={() => void flip()}
            disabled={flipping}
            className={cn(
              'relative inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ink transition-all',
              'shadow-[0_0_34px_rgba(216,178,90,0.28)] hover:brightness-110 active:scale-[0.97]',
              flipping && 'opacity-40',
            )}
          >
            <Zap className={cn('size-4', flipping && 'animate-pulse')} />
            {flipping ? 'En el aire…' : 'Lanzar'}
          </button>

          {/* Selector de divisa */}
          <div className={cn('no-scrollbar flex max-w-full items-end gap-2 overflow-x-auto px-2 py-1', flipping && 'pointer-events-none opacity-50')}>
            {COINS.map((c) => {
              const activa = c.id === skin.id
              return (
                <button
                  key={c.id}
                  onClick={() => elegirSkin(c)}
                  className="group flex shrink-0 cursor-pointer flex-col items-center gap-1.5"
                  aria-label={`Moneda ${c.nombre}`}
                  title={c.nombre}
                >
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-full border font-numi text-lg font-bold transition-all duration-300',
                      activa
                        ? '-translate-y-1 border-gold bg-gold/10 text-gold shadow-[0_0_22px_rgba(216,178,90,0.3)]'
                        : 'border-edge text-fog group-hover:-translate-y-1 group-hover:border-edge2 group-hover:text-paper',
                    )}
                  >
                    {c.simbolo}
                  </span>
                  <span className={cn('font-mono text-[9px] tracking-[0.22em]', activa ? 'text-gold' : 'text-fog/70')}>{c.code}</span>
                </button>
              )
            })}
          </div>

          {/* Estadísticas */}
          <div className="flex w-full max-w-6xl items-end justify-between gap-4 font-mono">
            <div className="hidden min-w-44 sm:block">
              <p className="text-[9px] uppercase tracking-[0.3em] text-fog/70">Lanzamientos</p>
              <p className="mt-1 text-2xl font-semibold text-paper">{lanzamientos}</p>
              <div className="mt-2 flex h-1 w-40 overflow-hidden rounded-full bg-edge">
                <div className="h-full bg-gold transition-all duration-500" style={{ width: `${pctCara}%` }} />
              </div>
              <p className="mt-1.5 text-[9px] tracking-[0.2em] text-fog/80">CARA {pctCara}% · SELLO {pctSello}%</p>
            </div>

            <div className="text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-fog/70">Historial</p>
              <p className="mt-1.5 text-[13px] tracking-[0.35em] text-fog/60">
                {history.length === 0 ? '— — —' : history.map((h, i) => (
                  <span key={i} className={cn(h === 'C' ? 'text-paper' : 'text-gold', i === history.length - 1 && 'underline underline-offset-4')}>{h}</span>
                ))}
              </p>
              <p className="mt-1.5 text-[9px] tracking-[0.2em] text-fog/50">p = 0,500 · crypto RNG</p>
            </div>

            <div className="hidden min-w-44 text-right sm:block">
              <p className="text-[9px] uppercase tracking-[0.3em] text-fog/70">Racha</p>
              <p className="mt-1 text-2xl font-semibold text-paper">
                {racha.n > 0 ? <>{racha.n}<span className="text-gold">×</span> <span className="text-base text-fog">{racha.face.toUpperCase()}</span></> : '—'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
