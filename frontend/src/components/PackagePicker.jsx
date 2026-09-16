import { motion, AnimatePresence } from "framer-motion";

export default function PackagePicker({ packages, selectedId, onSelect, disabled }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {packages.map((pkg, i) => {
        const isSelected = selectedId === pkg.id;
        return (
          <motion.button
            key={pkg.id}
            disabled={disabled}
            onClick={() => onSelect(pkg.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            whileHover={!disabled ? { y: -4, scale: 1.015 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`relative text-left p-4 rounded-2xl border-2 transition-colors bg-white ${
              isSelected ? "border-rose bg-rose/5 shadow-glow" : "border-plum/10 hover:border-plum/25 hover:shadow-card"
            } disabled:opacity-60`}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose text-white text-xs grid place-items-center shadow-glow"
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
            <div className="text-2xl mb-1">{pkg.emoji}</div>
            <div className="font-display text-lg text-plum">{pkg.title}</div>
            <p className="text-sm text-plum/60 mt-1">{pkg.description}</p>
            <p className="text-xs text-plum/40 mt-2">10 questions · {pkg.difficultyLabel} difficulty</p>
          </motion.button>
        );
      })}
    </div>
  );
}
