import { RecurringTransaction, NotificationItem } from '../../types';

export const evaluateRecurringNotifications = (
  recurring: RecurringTransaction[],
  familyId: string
): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  for (const item of recurring) {
    if (!item.is_active) continue;

    const isToday = item.next_occurrence <= todayStr;
    const isTomorrow = item.next_occurrence === tomorrowStr;

    if (isToday) {
      notifications.push({
        id: `notif-rec-due-${item.id}-${item.next_occurrence}`,
        family_id: familyId,
        type: 'recurring_due',
        title: `Tagihan ${item.description} Jatuh Tempo`,
        message: `Tagihan ${item.description} (Rp ${item.amount.toLocaleString('id-ID')}) biasanya dibayar hari ini. Ingin mencatatnya sekarang?`,
        data: { recurring_id: item.id, amount: item.amount, description: item.description },
        is_read: false,
        action_url: `/catat?recurring=${item.id}`,
        created_at: new Date().toISOString(),
      });
    } else if (isTomorrow) {
      notifications.push({
        id: `notif-rec-tomorrow-${item.id}-${item.next_occurrence}`,
        family_id: familyId,
        type: 'recurring_due',
        title: `Tagihan ${item.description} Besok`,
        message: `Tagihan ${item.description} (Rp ${item.amount.toLocaleString('id-ID')}) jatuh tempo besok.`,
        data: { recurring_id: item.id, amount: item.amount, description: item.description },
        is_read: false,
        action_url: `/catat?recurring=${item.id}`,
        created_at: new Date().toISOString(),
      });
    }
  }

  return notifications;
};
