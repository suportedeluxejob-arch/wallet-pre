import { en } from './translations/en'
import { pt } from './translations/pt'
import { es } from './translations/es'
import type { Language, Translations } from './types'

export const translations: Record<Language, Translations> = {
  en,
  pt,
  es,
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
}

export { Language, Translations }
