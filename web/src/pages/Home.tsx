import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

export default function Home() {
  const { lang } = useLanguage()

  return (
    <section className="hero">
      <div className="hero__content animate-fade-up">
        <p className="hero__eyebrow">{t(lang, 'homeEyebrow')}</p>
        <h1>{t(lang, 'homeTitle')}</h1>
        <p>{t(lang, 'homeLead')}</p>
        <div className="hero__actions animate-fade-up-delay">
          <Link to="/maalpinde" className="btn btn--primary">
            {t(lang, 'homeCtaObjectives')}
          </Link>
          <Link to="/test/oversigt" className="btn btn--ghost">
            {t(lang, 'homeCtaTest')}
          </Link>
        </div>
      </div>
    </section>
  )
}
