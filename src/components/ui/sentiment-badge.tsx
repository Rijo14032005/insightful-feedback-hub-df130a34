import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";

type Sentiment = "positive" | "neutral" | "negative";

interface SentimentBadgeProps {
  sentiment: Sentiment;
  score?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sentimentConfig = {
  positive: {
    label: "Positive",
    className: "sentiment-positive",
    icon: ThumbsUp,
  },
  neutral: {
    label: "Neutral",
    className: "sentiment-neutral",
    icon: Minus,
  },
  negative: {
    label: "Negative",
    className: "sentiment-negative",
    icon: ThumbsDown,
  },
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

export function SentimentBadge({
  sentiment,
  score,
  showIcon = true,
  size = "md",
  className,
}: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />}
      {config.label}
      {score !== undefined && (
        <span className="opacity-75">({(score * 100).toFixed(0)}%)</span>
      )}
    </span>
  );
}
