import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './IntegrationPage.da'
import PageEn from './IntegrationPage.en'

export default function IntegrationPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}
