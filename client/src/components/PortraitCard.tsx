type Props = {
  name: string
  hint?: string
  index: number
  selected?: boolean
  dead?: boolean
  disabled?: boolean
  onClick?: () => void
}

const HAIR = ['#2a1a14', '#5a3310', '#3a2438', '#1a120c', '#6a3a28', '#241018']
const SKIN = ['#f0d4b0', '#e8c4a0', '#f6e0c4', '#d4a888', '#ffe4c8', '#c98a6a']
const CLOAK = ['#c8102e', '#5a3850', '#1d4ed8', '#166534', '#ffc85a', '#8b2a12']

export default function PortraitCard({ name, hint, index, selected, dead, disabled, onClick }: Props) {
  const hair = HAIR[index % HAIR.length]
  const skin = SKIN[index % SKIN.length]
  const cloak = CLOAK[index % CLOAK.length]
  return (
    <button
      type="button"
      className={`portrait-card${selected ? ' selected' : ''}${dead ? ' dead' : ''}`}
      disabled={disabled || dead}
      onClick={onClick}
    >
      <svg viewBox="0 0 80 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="80" height="92" rx="8" fill="#3a2438" />
        <rect x="2" y="2" width="76" height="88" rx="7" fill="none" stroke="#ffc85a" strokeWidth="1.4" opacity="0.7" />
        <circle cx="40" cy="18" r="10" fill="none" stroke="#ffb08a" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="40" cy="86" rx="28" ry="18" fill={cloak} />
        <circle cx="40" cy="40" r="16" fill={skin} />
        <path d={`M24 38 Q40 10 56 38 Q52 22 40 18 Q28 22 24 38`} fill={hair} />
        <ellipse cx="34" cy="40" rx="2.2" ry="2.6" fill="#1a120c" />
        <ellipse cx="46" cy="40" rx="2.2" ry="2.6" fill="#1a120c" />
        <path d="M34 50 Q40 54 46 50" fill="none" stroke="#8b2a12" strokeWidth="1.2" />
        <rect x="28" y="56" width="24" height="8" rx="2" fill="#fff4e4" opacity="0.25" />
      </svg>
      <div className="who">{name}</div>
      {hint && <div className="hint">{hint}</div>}
    </button>
  )
}
