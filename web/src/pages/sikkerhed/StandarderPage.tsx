import { useLanguage } from '../../i18n/LanguageContext'
import StandarderPageDa from './StandarderPage.da'
import StandarderPageEn from './StandarderPage.en'

export default function StandarderPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <StandarderPageEn /> : <StandarderPageDa />
}
