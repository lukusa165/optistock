export default function Pagination({ page, setPage, totalPages, totalCount, pageSize }) {
  if (totalPages <= 1) return null
  const debut = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const fin = Math.min(page * pageSize, totalCount)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
        {debut}–{fin} sur {totalCount}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
        <span style={{ fontSize: 12, color: 'var(--muted)', padding: '0 6px' }}>Page {page} / {totalPages}</span>
        <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
      </div>
    </div>
  )
}