import { useLanguage } from '../../i18n/LanguageContext'
import HashingPageDa from './HashingPage.da'
import HashingPageEn from './HashingPage.en'

export default function HashingPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <HashingPageEn /> : <HashingPageDa />
}
