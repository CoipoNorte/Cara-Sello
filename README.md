# [Cara o Sello · Lanzamiento de moneda animado](https://coiponorte.github.io/Cara-Sello/)

Una experiencia de una sola vista: una moneda grabada vista desde arriba sobre
un fondo minimalista de estudio. La moneda **salta, gira en 3D y cae** mostrando
**CARA o SELLO** de forma totalmente aleatoria (RNG criptográfico), con chispas,
sonido sintetizado y estadísticas en vivo.

## Divisas incluidas

| Código | Divisa | Metal |
|---|---|---|
| USD | Dólar estadounidense | Níquel |
| EUR | Euro | Oro nórdico |
| GBP | Libra esterlina | Oro |
| JPY | Yen japonés | Plata |
| CNY | Yuan chino （元） | Latón |
| INR | Rupia india (₹) | Acero |
| CLP | Peso chileno | Cobre |

> Añadir más (BRL `R$`, KRW `₩`, MXN…): copia un objeto en **`src/lib/coins.ts`**
> y cambia símbolo, leyendas y paleta. El selector y la moneda se generan solos.

## Stack

- **React 19 + TypeScript + Vite** (build *single-file*: todo se inyecta en `dist/index.html`)
- **Tailwind CSS 4** · **framer-motion** (física del giro) · **lucide-react** (iconos)
- **Sonido WebAudio sintetizado** (`src/lib/sound.ts`) → cero archivos de audio
- **Moneda 100 % SVG programático** (`src/components/Coin.tsx`) → cero imágenes

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (un solo index.html autocontenido)
```

**Controles:** clic en la moneda · `ESPACIO` / `ENTER` para lanzar ·
icono altavoz silencia · icono circular reinicia estadísticas.

---

## Estructura del proyecto

```
├── index.html                  # shell + favicon SVG inline
├── src/
│   ├── App.tsx                 # vista única
│   ├── views/CoinFlip.tsx      # escena: física, parallax, UI, estadísticas
│   ├── components/Coin.tsx     # moneda SVG 3D (grabados, arcos, cantos)
│   ├── lib/
│   │   ├── coins.ts            # skins de divisas + RNG criptográfico
│   │   └── sound.ts            # whoosh/clink sintetizados (WebAudio)
│   └── index.css               # tema oro/carbón, 3D, grano, destello
├── .gitignore                  # node_modules, dist, .env, cachés gh-pages…
└── README.md
```

## Notas técnicas (datos importantes)

- **Aleatoriedad real:** `crypto.getRandomValues` decide cara/sello y la
  física (3–5 vueltas, inclinación final). La cara resultante se calcula con
  aritmética modular sobre el `rotateY` acumulado: la moneda siempre aterriza
  exactamente en la cara sorteada.
- **Audio:** los navegadores bloquean sonido sin gesto del usuario; el
  `AudioContext` se crea en el primer lanzamiento (ya es un gesto válido).
- **Accesibilidad:** la moneda es un `<button>` con `aria-label`; si quieres
  respetar `prefers-reduced-motion`, reduce las vueltas en `flip()`.
- **Estado volátil:** las estadísticas viven en memoria. Para persistirlas,
  guarda `counts/history` en `localStorage` dentro de un `useEffect`.

Hecho con React, framer-motion y una moneda muy bien grabada.
