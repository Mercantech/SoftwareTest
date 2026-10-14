import { useLanguage } from '../../i18n/LanguageContext'
import AuthenticationPageDa from './AuthenticationPage.da'
import AuthenticationPageEn from './AuthenticationPage.en'

export default function AuthenticationPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <AuthenticationPageEn /> : <AuthenticationPageDa />
}
