import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './CiCdPage.da'
import PageEn from './CiCdPage.en'

export default function CiCdPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}