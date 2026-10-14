import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './UnitPage.da'
import PageEn from './UnitPage.en'

export default function UnitPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}