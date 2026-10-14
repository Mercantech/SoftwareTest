import { Link } from 'react-router-dom'
import LinkTrio from '../components/LinkTrio'
import ObjectiveBadge from '../components/ObjectiveBadge'
import { objectives } from '../data/objectives'

export default function Hub() {
  return (
    <div>
      <header className="hub-intro lesson">
        <h1>Målpinde</h1>
        <p>
          Alle 15 målpinde for faget softwaretest og sikkerhed (16484). Brug linkene
          til at hoppe mellem site, Notion og eksempel-repo.
        </p>
      </header>
      <div className="prose">
        <table className="hub-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Målpinde</th>
              <th scope="col">Links</th>
            </tr>
          </thead>
          <tbody>
            {objectives.map((obj) => (
              <tr key={obj.id}>
                <td>{obj.id}</td>
                <td>
                  <div className="hub-title">
                    <ObjectiveBadge level={obj.level} />{' '}
                    <Link to={obj.sitePath}>{obj.title}</Link>
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
