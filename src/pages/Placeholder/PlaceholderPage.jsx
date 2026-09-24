import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title }) {
  return (
    <main className="placeholder-page">
      <div className="placeholder-card">
        <span>TABLEHUB 2.0</span>
        <h1>{title}</h1>
        <p>Esta rota já está preparada. A tela será construída na próxima etapa do redesign.</p>
        <Link className="th-btn th-btn--glass" to="/">Voltar para a Home</Link>
      </div>
    </main>
  )
}
