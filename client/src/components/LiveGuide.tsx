export default function LiveGuide({
  title,
  lines,
  suggestion,
  onApply,
}: {
  title?: string
  lines: string[]
  suggestion?: string | null
  onApply?: (() => void) | null
}) {
  const shown = lines.filter(Boolean)
  if (!shown.length && !suggestion) return null
  return (
    <div className="holo-panel live-guide">
      <h2>{title || '助手'}</h2>
      {shown.length > 0 && (
        <ol>
          {shown.map((l, i) => <li key={i}>{l}</li>)}
        </ol>
      )}
      {suggestion ? <p className="live-guide-suggest">{suggestion.startsWith('建议') ? suggestion : `建议：${suggestion}`}</p> : null}
      {onApply ? (
        <button type="button" className="btn live-guide-apply" onClick={onApply}>按助手走</button>
      ) : null}
    </div>
  )
}
