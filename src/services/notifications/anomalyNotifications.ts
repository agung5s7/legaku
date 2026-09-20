import { Transaction, NotificationItem } from '../../types';

export const evaluateAnomalyNotifications = (
  transactions: Transaction[],
  familyId: string
): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length < 5) return notifications;

  // Group by category to find average and standard thresholds
  const catExpenses: { [catId: string]: number[] } = {};
  for (const tx of expenses) {
    if (!catExpenses[tx.category_id]) catExpenses[tx.category_id] = [];
    catExpenses[tx.category_id].push(Number(tx.amount));
  }

  // Check recent transactions (last 3) for unusually high amount (> 3x category average)
  const recentExpenses = expenses.slice(0, 3);
  for (const tx of recentExpenses) {
    const historical = catExpenses[tx.category_id] || [];
    if (historical.length < 3) continue;

    const avg = historical.reduce((a, b) => a + b, 0) / historical.length;
    // If more than 3x the average and above Rp 300.000
    if (Number(tx.amount) >= avg * 3 && Number(tx.amount) >= 300000) {
      notifications.push({
        id: `anomaly-${tx.id}`,
        family_id: familyId,
        type: 'unusual_transaction',
        title: `Pengeluaran ${tx.category_name || 'Khusus'}`,
        message: `Transaksi "${tx.description}" senilai Rp ${Number(tx.amount).toLocaleString('id-ID')} terbilang cukup besar dibanding rata-rata biasanya (Rp ${Math.round(avg).toLocaleString('id-ID')}).`,
        data: { transaction_id: tx.id, amount: tx.amount, average: avg },
        is_read: false,
        action_url: '/transactions',
        created_at: tx.created_at,
      });
    }
  }

  return notifications;
};
