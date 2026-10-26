import { cn } from "@/lib/utils";

interface StockBarProps {
  stock: number;
  minStock: number;
  maxDisplay?: number;
  className?: string;
}

export default function StockBar({
  stock,
  minStock,
  maxDisplay,
  className,
}: StockBarProps) {
  const max = maxDisplay ?? Math.max(stock, minStock * 3, 1);
  const pct = Math.min((stock / max) * 100, 100);

  const color =
    stock === 0
      ? "bg-red-500"
      : stock <= minStock
      ? "bg-yellow-400"
      : "bg-green-500";

  return (
    <div
      className={cn("w-full bg-gray-100 rounded-full h-1.5", className)}
      role="progressbar"
      aria-valuenow={stock}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Stock: ${stock}`}
    >
      <div
        className={cn("h-1.5 rounded-full transition-all duration-300", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
