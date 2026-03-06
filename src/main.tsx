import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error -- CSS-only font package has no type declarations
import '@fontsource-variable/noto-nastaliq-urdu'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
