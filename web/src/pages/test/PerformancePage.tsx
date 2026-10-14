import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './PerformancePage.da'
import PageEn from './PerformancePage.en'

export default function PerformancePage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}
