import { useLanguage } from '../../i18n/LanguageContext'
import PageDa from './ReleasePage.da'
import PageEn from './ReleasePage.en'

export default function ReleasePage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <PageEn /> : <PageDa />
}
