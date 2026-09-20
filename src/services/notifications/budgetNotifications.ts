import { Budget, NotificationItem, Transaction } from '../../types';

export const evaluateBudgetNotifications = (
  budgets: Budget[],
  transactions: Transaction[],
  familyId: string
): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Filter budgets for current month
  const currentBudgets = budgets.filter((b) => b.month === currentMonth && b.year === currentYear);

  for (const bgt of currentBudgets) {
    if (!bgt.amount || bgt.amount <= 0) continue;

    // Calculate actual spend for this category this month
    const spent = transactions
      .filter((tx) => {
        const d = new Date(tx.transaction_date);
        return (
          tx.type === 'expense' &&
          tx.category_id === bgt.category_id &&
          d.getMonth() + 1 === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const percentage = Math.round((spent / bgt.amount) * 100);
    const catName = bgt.category_name || 'Pengeluaran';

    if (percentage >= 100) {
      notifications.push({
        id: `bgt-exceeded-${bgt.id}-${currentMonth}-${currentYear}`,
        family_id: familyId,
        type: 'budget_exceeded',
        title: `Anggaran ${catName} Melewati Batas`,
        message: `Anggaran pos ${catName} bulan ini telah terpakai ${percentage}%. Luangkan waktu sejenak untuk meninjau pos belanja ini bersama.`,
        data: { budget_id: bgt.id, category_name: catName, percentage, spent, budget: bgt.amount },
        is_read: false,
        action_url: '/review',
        created_at: new Date().toISOString(),
      });
    } else if (percentage >= 80) {
      notifications.push({
        id: `bgt-warn-${bgt.id}-${currentMonth}-${currentYear}`,
        family_id: familyId,
        type: 'budget_warning',
        title: `Anggaran ${catName} Terpakai ${percentage}%`,
        message: `Anggaran ${catName} sudah terpakai ${percentage}%. Sisa dana aman tersedia Rp ${(bgt.amount - spent).toLocaleString('id-ID')}.`,
        data: { budget_id: bgt.id, category_name: catName, percentage, spent, budget: bgt.amount },
        is_read: false,
        action_url: '/review',
        created_at: new Date().toISOString(),
      });
    }
  }

  return notifications;
};
