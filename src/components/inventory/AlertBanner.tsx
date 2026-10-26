import { AlertTriangle, Clock, ShieldAlert, PackageX } from "lucide-react";
import { InventoryAlerts } from "@/hooks/useInventoryAlerts";

interface AlertBannerProps {
  alerts: InventoryAlerts;
  onFilterClick?: (filter: string) => void;
}

export default function AlertBanner({
  alerts,
  onFilterClick,
}: AlertBannerProps) {
  const items = [
    {
      key: "out-of-stock",
      count: alerts.outOfStock.length,
      label: "Out of Stock",
      icon: PackageX,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-500",
      textColor: "text-red-800",
      subColor: "text-red-600",
    },
    {
      key: "low-stock",
      count: alerts.lowStock.length,
      label: "Low Stock",
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      iconColor: "text-yellow-500",
      textColor: "text-yellow-800",
      subColor: "text-yellow-600",
    },
    {
      key: "expiring",
      count: alerts.expiringSoon.length,
      label: "Expiring Soon",
      icon: Clock,
      bg: "bg-orange-50",
      border: "border-orange-200",
      iconColor: "text-orange-500",
      textColor: "text-orange-800",
      subColor: "text-orange-600",
    },
    {
      key: "expired",
      count: alerts.expired.length,
      label: "Expired",
      icon: ShieldAlert,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-500",
      textColor: "text-red-800",
      subColor: "text-red-600",
    },
  ].filter((a) => a.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(
        ({
          key,
          count,
          label,
          icon: Icon,
          bg,
          border,
          iconColor,
          textColor,
          subColor,
        }) => (
          <button
            key={key}
            onClick={() => onFilterClick?.(key)}
            className={`${bg} ${border} border rounded-xl p-3 flex items-center gap-3 text-left hover:shadow-sm transition-shadow w-full`}
          >
            <Icon size={20} className={`${iconColor} shrink-0`} />
            <div>
              <p className={`text-sm font-bold ${textColor}`}>{count}</p>
              <p className={`text-xs ${subColor}`}>{label}</p>
            </div>
          </button>
        )
      )}
    </div>
  );
}
