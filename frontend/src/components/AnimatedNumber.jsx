import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Animates from the previous value to `value` with a springy count-up,
// instead of scores just snapping to the new number.
export default function AnimatedNumber({ value, className }) {
  const motionVal = useMotionValue(value);
  const spring = useSpring(motionVal, { stiffness: 120, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
