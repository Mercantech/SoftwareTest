import { Link } from 'react-router-dom'

type LinkTrioProps = {
  sitePath?: string
  notionUrl?: string
  repoUrl?: string
}

export default function LinkTrio({ sitePath, notionUrl, repoUrl }: LinkTrioProps) {
  return (
    <div className="link-trio">
      {sitePath ? (
        <Link to={sitePath}>Site</Link>
      ) : null}
      {notionUrl ? (
        <a href={notionUrl} target="_blank" rel="noreferrer">
          Notion
        </a>
      ) : null}
      {repoUrl ? (
        <a href={repoUrl} target="_blank" rel="noreferrer">
          Repo
        </a>
      ) : null}
    </div>
  )
}
