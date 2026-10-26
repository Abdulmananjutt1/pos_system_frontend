import Badge from "@/components/ui/Badge";
import { isExpired, isExpiringSoon } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface ExpiryBadgeProps {
  expiryDate: string;
  now: Date;
  showDate?: boolean;
}

export default function ExpiryBadge({
  expiryDate,
  now,
  showDate = false,
}: ExpiryBadgeProps) {
  const expired = isExpired(expiryDate, now);
  const expiring = !expired && isExpiringSoon(expiryDate, 30, now);

  const label = expired
    ? "Expired"
    : expiring
    ? "Expiring Soon"
    : showDate
    ? formatDate(expiryDate)
    : "Valid";

  const variant = expired ? "danger" : expiring ? "warning" : "success";

  return <Badge variant={variant}>{label}</Badge>;
}
