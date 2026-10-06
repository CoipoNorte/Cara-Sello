/* ============================================================================
 * coins.ts — SKINS DE MONEDAS (divisas del mundo)
 * ----------------------------------------------------------------------------
 * Cada skin define el grabado de la moneda: símbolo central, leyendas en arco
 * y la paleta metalizada (gradientes del SVG en src/components/Coin.tsx).
 *
 * ¿Quieres más países? Copia un objeto, cambia símbolo, leyendas y colores:
 * el componente Coin lo renderiza automáticamente. Sugerencias: BRL 'R$',
 * MXN '$', ARS '$', KRW '₩', CHF 'Fr', RUB '₽', SEK 'kr'…
 * ==========================================================================*/

export interface CoinSkin {
  id: string
  /** Código ISO de la divisa (etiqueta del selector) */
  code: string
  nombre: string
  /** Símbolo central del anverso (CARA) */
  simbolo: string
  /** Leyenda en arco superior de la CARA */
  caraTop: string
  /** Leyenda en arco inferior de la CARA */
  caraBottom: string
  /** Texto bajo el "1" del SELLO */
  selloSub: string
  /** Paleta del metal — se usan en los gradientes radiales del SVG */
  metal: { light: string; base: string; dark: string; edge: string }
}

export const COINS: CoinSkin[] = [
  {
    id: 'usd', code: 'USD', nombre: 'Dólar estadounidense', simbolo: '$',
    caraTop: 'UNITED STATES', caraBottom: 'IN GOD WE TRUST', selloSub: 'UN DÓLAR',
    metal: { light: '#F6F8FA', base: '#C7CDD5', dark: '#767D88', edge: '#53585F' },
  },
  {
    id: 'eur', code: 'EUR', nombre: 'Euro', simbolo: '€',
    caraTop: 'UNIÓN EUROPEA', caraBottom: 'EUROPA · 2026', selloSub: 'UN EURO',
    metal: { light: '#FFF4C8', base: '#E5C45A', dark: '#A2791F', edge: '#715414' },
  },
  {
    id: 'gbp', code: 'GBP', nombre: 'Libra esterlina', simbolo: '£',
    caraTop: 'UNITED KINGDOM', caraBottom: 'ONE POUND', selloSub: 'UNA LIBRA',
    metal: { light: '#FFEDAC', base: '#D9AE3C', dark: '#8C6A18', edge: '#624612' },
  },
  {
    id: 'jpy', code: 'JPY', nombre: 'Yen japonés', simbolo: '¥',
    caraTop: 'NIPPON · JAPAN', caraBottom: '日本国', selloSub: 'UN YEN',
    metal: { light: '#FFFFFF', base: '#D7DBE1', dark: '#868C97', edge: '#5E636C' },
  },
  {
    id: 'cny', code: 'CNY', nombre: 'Yuan chino', simbolo: '元',
    caraTop: 'ZHŌNGGUÓ · CHINA', caraBottom: '中华人民共和国', selloSub: 'UN YUAN',
    metal: { light: '#FFEFA8', base: '#DFAE42', dark: '#8F6B10', edge: '#5F470A' },
  },
  {
    id: 'inr', code: 'INR', nombre: 'Rupia india', simbolo: '₹',
    caraTop: 'भारत · INDIA', caraBottom: 'रुपया · RUPEE', selloSub: 'UNA RUPIA',
    metal: { light: '#FBFDFE', base: '#C3CAD2', dark: '#757C87', edge: '#4E545D' },
  },
  {
    id: 'clp', code: 'CLP', nombre: 'Peso chileno', simbolo: '$',
    caraTop: 'REPÚBLICA DE CHILE', caraBottom: 'SOBERANÍA', selloSub: 'UN PESO',
    metal: { light: '#F8C79E', base: '#B96838', dark: '#743818', edge: '#4C2410' },
  },
]

export type CaraOSello = 'cara' | 'sello'

/** RNG criptográfico: más justo que Math.random para el 50/50. */
export function tirarMoneda(): CaraOSello {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return (buf[0] ?? 0) % 2 === 0 ? 'cara' : 'sello'
}
