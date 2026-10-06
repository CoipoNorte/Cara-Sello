# Cara o Sello · Lanzamiento de moneda animado

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

## 🚀 Despliegue en GitHub Pages

El proyecto usa `vite-plugin-singlefile`: **`dist/index.html` no depende de
ningún asset externo**, así que funciona en cualquier subruta de GitHub Pages
sin tocar `base`. Igualmente, dejamos el flujo clásico documentado.

### Paso 1 · Sube el repo

```bash
git init
git add .
git commit -m "Cara o Sello · moneda animada"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cara-o-sello.git
git push -u origin main
```

### Paso 2 · Añade gh-pages a `package.json`

El paquete `gh-pages` ya está instalado. Añade **estas tres líneas** a tu
`package.json` (campo `homepage` + scripts de despliegue):

```jsonc
{
  "name": "cara-o-sello",
  "homepage": "https://TU-USUARIO.github.io/cara-o-sello",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "predeploy": "npm run build",          // ← añade esto
    "deploy": "gh-pages -d dist"           // ← y esto
  }
}
```

> Si `gh-pages` no aparece en `devDependencies`, instálalo:
> `npm install -D gh-pages`

### Paso 3 · Despliega

```bash
npm run deploy
```

Esto compila y publica `dist/` en la rama **`gh-pages`**. Activa Pages en
**GitHub → Settings → Pages → Source → `gh-pages` branch / (root)** y en ~1 min:

```
https://TU-USUARIO.github.io/cara-o-sello/
```

Cada cambio posterior: `git push` + `npm run deploy` y listo.

### ⚠️ Nota sobre rutas (importante si cambias la config)

- Con el *single-file* actual no hace falta nada más.
- Si algún día quitas `viteSingleFile()` del `vite.config.ts` o añades imágenes
  en `public/`, pon en `vite.config.ts`:
  ```ts
  export default defineConfig({
    base: '/cara-o-sello/',   // ← nombre EXACTO del repo, con barras
    // …plugins
  })
  ```
  y referencia los assets de `public/` con rutas relativas (`./img/…`).

### Alternativa: despliegue automático con GitHub Actions

Crea `.github/workflows/deploy.yml` y cada `git push` a `main` publicará solo:

```yaml
name: Deploy a GitHub Pages
on:
  push: { branches: [main] }
permissions:
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

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
