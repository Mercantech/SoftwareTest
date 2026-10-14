import { Link } from 'react-router-dom'
import LinkTrio from '../components/LinkTrio'
import ObjectiveBadge from '../components/ObjectiveBadge'
import { objectiveTitle, objectives } from '../data/objectives'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

export default function Hub() {
  const { lang } = useLanguage()

  return (
    <div>
      <header className="hub-intro lesson">
        <h1>{t(lang, 'hubTitle')}</h1>
        <p>{t(lang, 'hubLead')}</p>
      </header>
      <div className="prose">
        <table className="hub-table">
          <thead>
            <tr>
              <th scope="col">{t(lang, 'hubColId')}</th>
              <th scope="col">{t(lang, 'hubColObjective')}</th>
              <th scope="col">{t(lang, 'hubColLinks')}</th>
            </tr>
          </thead>
          <tbody>
            {objectives.map((obj) => (
              <tr key={obj.id}>
                <td>{obj.id}</td>
                <td>
                  <div className="hub-title">
                    <ObjectiveBadge level={obj.level} />{' '}
                    <Link to={obj.sitePath}>{objectiveTitle(obj, lang)}</Link>
                  </div>
                </td>
                <td>
                  <LinkTrio
                    sitePath={obj.sitePath}
                    notionUrl={obj.notionUrl}
                    repoUrl={obj.repoUrl}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
