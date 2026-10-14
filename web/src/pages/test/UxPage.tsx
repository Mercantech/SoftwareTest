import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './UxPage.da'
import PageEn from './UxPage.en'

export default function UxPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}
