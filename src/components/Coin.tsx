/* ============================================================================
 * Coin.tsx — MONEDA 3D GRABADA EN SVG
 * ----------------------------------------------------------------------------
 * Dos caras (anverso/reverso) en un contenedor preserve-3d. El giro lo gobierna
 * el padre (CoinFlip) con framer-motion: aquí solo dibujamos.
 *
 * Todo es volumen falso por capas, igual que en una moneda real:
 *  canto → reborde estriado → campo con gradiente → orla de perlas →
 *  leyendas en arco (colocadas carácter a carácter) → ceca en relieve.
 * ==========================================================================*/
import type { CoinSkin } from '@/lib/coins'

const C = 160 // centro del viewBox 320×320

/** Estrella de 4 puntas (filete numismático decorativo). */
function Estrella({ x, y, s, color, op = 0.75 }: { x: number; y: number; s: number; color: string; op?: number }) {
  const k = s * 0.26
  return (
    <path
      d={`M ${x} ${y - s} L ${x + k} ${y - k} L ${x + s} ${y} L ${x + k} ${y + k} L ${x} ${y + s} L ${x - k} ${y + k} L ${x - s} ${y} L ${x - k} ${y - k} Z`}
      fill={color} opacity={op}
    />
  )
}

/** Leyenda en arco: cada carácter se posiciona y rota manualmente para que
 *  quede siempre legible (técnica más fiable que textPath en todos los navegadores). */
function Arco({ texto, r, top, size, color, stepMax }: {
  texto: string; r: number; top: boolean; size: number; color: string; stepMax: number
}) {
  const n = texto.length
  const step = Math.min(stepMax, 128 / Math.max(n, 7))
  return (
    <g>
      {texto.split('').map((ch, i) => {
        const ang = (top ? -90 : 90) + (i - (n - 1) / 2) * step
        const rad = (ang * Math.PI) / 180
        const x = C + r * Math.cos(rad)
        const y = C + r * Math.sin(rad)
        const rot = top ? ang + 90 : ang - 90
        return (
          <text
            key={i}
            x={x} y={y}
            transform={`rotate(${rot} ${x} ${y})`}
            textAnchor="middle" dominantBaseline="central"
            fontSize={size} fontWeight={700} fill={color}
            fontFamily="'Cinzel', serif" opacity={0.9}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </text>
        )
      })}
    </g>
  )
}

/** Corona de estrellas del reverso (SELLO). */
function Corona({ r, color }: { r: number; color: string }) {
  return (
    <g>
      {[...Array(8)].map((_, i) => {
        const rad = ((i * 45 - 90) * Math.PI) / 180
        return <Estrella key={i} x={C + r * Math.cos(rad)} y={C + r * Math.sin(rad)} s={6.5} color={color} op={0.55} />
      })}
    </g>
  )
}

function CaraSVG({ skin, lado }: { skin: CoinSkin; lado: 'cara' | 'sello' }) {
  const m = skin.metal
  const gid = `campo-${skin.id}-${lado}`
  return (
    <svg viewBox="0 0 320 320" className="size-full" aria-hidden>
      <defs>
        <radialGradient id={gid} cx="42%" cy="36%" r="75%">
          <stop offset="0%" stopColor={m.light} />
          <stop offset="55%" stopColor={m.base} />
          <stop offset="100%" stopColor={m.dark} />
        </radialGradient>
      </defs>

      {/* Canto + reborde estriado (estrías radiales simuladas con guiones) */}
      <circle cx={C} cy={C} r={159} fill={m.edge} />
      <circle cx={C} cy={C} r={150} fill="none" stroke={m.dark} strokeWidth={18} strokeDasharray="3.1 7.6" opacity={0.65} />
      <circle cx={C} cy={C} r={150} fill="none" stroke={m.light} strokeWidth={2} opacity={0.35} />

      {/* Campo con luz cenital */}
      <circle cx={C} cy={C} r={143} fill={`url(#${gid})`} />

      {/* Orla de perlas + filete interior */}
      <circle cx={C} cy={C} r={132} fill="none" stroke={m.dark} strokeWidth={4.5} strokeDasharray="0.1 7.35" strokeLinecap="round" opacity={0.5} />
      <circle cx={C} cy={C} r={125} fill="none" stroke={m.dark} strokeWidth={1.3} opacity={0.45} />

      {lado === 'cara' ? (
        <>
          <Arco texto={skin.caraTop} r={113} top size={19} color={m.dark} stepMax={8.6} />
          <Arco texto={skin.caraBottom} r={104} top={false} size={14.5} color={m.dark} stepMax={7.2} />
          {/* Ceca: sombra de brillo incusa + grabado oscuro (relieve falso) */}
          <text x={C} y={172} textAnchor="middle" fontSize={112} fontWeight={800} fill={m.light} opacity={0.6} fontFamily="'Cinzel', serif">
            {skin.simbolo}
          </text>
          <text x={C} y={169.5} textAnchor="middle" fontSize={112} fontWeight={800} fill={m.dark} fontFamily="'Cinzel', serif">
            {skin.simbolo}
          </text>
          <Estrella x={73} y={160} s={9} color={m.dark} />
          <Estrella x={247} y={160} s={9} color={m.dark} />
        </>
      ) : (
        <>
          <Arco texto="CARA O SELLO" r={113} top size={18} color={m.dark} stepMax={9} />
          <Corona r={86} color={m.dark} />
          <text x={C} y={158} textAnchor="middle" fontSize={104} fontWeight={800} fill={m.light} opacity={0.6} fontFamily="'Cinzel', serif">1</text>
          <text x={C} y={155.5} textAnchor="middle" fontSize={104} fontWeight={800} fill={m.dark} fontFamily="'Cinzel', serif">1</text>
          <text x={C} y={206} textAnchor="middle" fontSize={15.5} fontWeight={700} letterSpacing={2.5} fill={m.dark} fontFamily="'Cinzel', serif" opacity={0.9}>
            {skin.selloSub}
          </text>
          <text x={C} y={228} textAnchor="middle" fontSize={11} fontWeight={600} letterSpacing={4} fill={m.dark} fontFamily="'Cinzel', serif" opacity={0.7}>
            MMXXVI
          </text>
        </>
      )}
    </svg>
  )
}

/** Moneda completa: dos caras apiladas en 3D. El tamaño lo fija el padre. */
export default function Coin({ skin }: { skin: CoinSkin }) {
  return (
    <div className="coin3d relative size-full">
      <div className="coin-face">
        <CaraSVG skin={skin} lado="cara" />
      </div>
      <div className="coin-face back">
        <CaraSVG skin={skin} lado="sello" />
      </div>
    </div>
  )
}
