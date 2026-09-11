export default function PackagePicker({ packages, selectedId, onSelect, disabled }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          disabled={disabled}
          onClick={() => onSelect(pkg.id)}
          className={`text-left p-4 rounded-2xl border-2 transition-colors bg-white ${
            selectedId === pkg.id ? "border-rose bg-rose/5" : "border-plum/10 hover:border-plum/25"
          } disabled:opacity-60`}
        >
          <div className="text-2xl mb-1">{pkg.emoji}</div>
          <div className="font-display text-lg text-plum">{pkg.title}</div>
          <p className="text-sm text-plum/60 mt-1">{pkg.description}</p>
          <p className="text-xs text-plum/40 mt-2">10 questions · {pkg.difficultyLabel} difficulty</p>
        </button>
      ))}
    </div>
  );
}
