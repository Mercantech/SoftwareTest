import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './OversigtPage.da'
import PageEn from './OversigtPage.en'

export default function OversigtPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}