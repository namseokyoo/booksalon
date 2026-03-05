import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatRelativeDate(
  timestamp: string | Date | { toDate: () => Date } | null | undefined
): string {
  if (!timestamp) return '방금 전';
  let date: Date;
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    date = timestamp.toDate();
  } else {
    return '방금 전';
  }
  if (isNaN(date.getTime())) return '방금 전';
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}
