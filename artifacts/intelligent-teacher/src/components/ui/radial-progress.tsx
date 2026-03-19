import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadialProgressProps {
  value: number;
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RadialProgress({ 
  value, 
  label, 
  sublabel,
  size = 120, 
  strokeWidth = 12,
  className 
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Ensure value is between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value || 0));
  const offset = circumference - (clampedValue / 100) * circumference;

  let colorClass = "text-primary";
  if (clampedValue < 60) colorClass = "text-destructive";
  else if (clampedValue < 80) colorClass = "text-yellow-500";

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted fill-none"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn("fill-none drop-shadow-md", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {label && <span className="font-display font-bold text-3xl text-foreground">{label}</span>}
        {sublabel && <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{sublabel}</span>}
      </div>
    </div>
  );
}
