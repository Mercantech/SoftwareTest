import { useLanguage } from '../../i18n/LanguageContext'
import AngrebPageDa from './AngrebPage.da'
import AngrebPageEn from './AngrebPage.en'

export default function AngrebPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <AngrebPageEn /> : <AngrebPageDa />
}
