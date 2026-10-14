import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './TrykPage.da'
import PageEn from './TrykPage.en'

export default function TrykPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}
