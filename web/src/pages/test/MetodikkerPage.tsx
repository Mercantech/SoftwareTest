import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './MetodikkerPage.da'
import PageEn from './MetodikkerPage.en'

export default function MetodikkerPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}