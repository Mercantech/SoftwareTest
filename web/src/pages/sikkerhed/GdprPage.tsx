import { useLanguage } from '../../i18n/LanguageContext'
import GdprPageDa from './GdprPage.da'
import GdprPageEn from './GdprPage.en'

export default function GdprPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <GdprPageEn /> : <GdprPageDa />
}
