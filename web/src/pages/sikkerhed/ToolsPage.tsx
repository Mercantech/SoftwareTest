import { useLanguage } from '../../i18n/LanguageContext'
import ToolsPageDa from './ToolsPage.da'
import ToolsPageEn from './ToolsPage.en'

export default function ToolsPage() {
  const { lang } = useLanguage()
  return lang === 'en' ? <ToolsPageEn /> : <ToolsPageDa />
}
