import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="hero">
      <div className="hero__content animate-fade-up">
        <p className="hero__eyebrow">Mercantec pensum</p>
        <h1>Software test og sikkerhed</h1>
        <p>
          Interaktivt overblik over test, kvalitet og sikkerhed — fra unit tests til
          CI/CD og web-sikkerhed.
        </p>
        <div className="hero__actions animate-fade-up-delay">
          <Link to="/maalpinde" className="btn btn--primary">
            Se målpinde
          </Link>
          <Link to="/test/oversigt" className="btn btn--ghost">
            Start med test
          </Link>
        </div>
      </div>
    </section>
  )
}
