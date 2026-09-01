export default function LiveGuide({ title, lines }: { title?: string; lines: string[] }) {
  const shown = lines.filter(Boolean)
  if (!shown.length) return null
  return (
    <div className="holo-panel live-guide">
      <h2>{title || '这一步'}</h2>
      <ol>
        {shown.map((l, i) => <li key={i}>{l}</li>)}
      </ol>
    </div>
  )
}
