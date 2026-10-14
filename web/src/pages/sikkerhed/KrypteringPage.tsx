import { useLanguage } from '../../i18n/LanguageContext'
import KrypteringPageDa from './KrypteringPage.da'
import KrypteringPageEn from './KrypteringPage.en'

export default function KrypteringPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <KrypteringPageEn /> : <KrypteringPageDa />
}
