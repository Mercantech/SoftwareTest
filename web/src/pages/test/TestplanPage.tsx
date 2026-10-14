import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './TestplanPage.da'
import PageEn from './TestplanPage.en'

export default function TestplanPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}