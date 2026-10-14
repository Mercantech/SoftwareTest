import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './BrunoE2ePage.da'
import PageEn from './BrunoE2ePage.en'

export default function BrunoE2ePage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}