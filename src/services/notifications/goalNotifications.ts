import { Goal, NotificationItem } from '../../types';

export const evaluateGoalNotifications = (
  goals: Goal[],
  familyId: string
): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const milestones = [100, 90, 75, 50, 25];

  for (const goal of goals) {
    if (!goal.target_amount || goal.target_amount <= 0) continue;

    const progress = Math.round((goal.current_amount / goal.target_amount) * 100);

    // Find highest milestone reached
    const reached = milestones.find((m) => progress >= m);
    if (!reached) continue;

    const remaining = Math.max(0, goal.target_amount - goal.current_amount);

    let message = '';
    if (reached === 100) {
      message = `Selamat! Target impian "${goal.name}" telah tercapai sepenuhnya 100%!`;
    } else {
      message = `Target "${goal.name}" sudah mencapai ${reached}%. Tinggal Rp ${remaining.toLocaleString('id-ID')} lagi menuju impian keluarga.`;
    }

    notifications.push({
      id: `goal-milestone-${goal.id}-${reached}`,
      family_id: familyId,
      type: 'goal_milestone',
      title: reached === 100 ? `Target ${goal.name} Tercapai 🎉` : `Target ${goal.name} Mencapai ${reached}%`,
      message,
      data: { goal_id: goal.id, milestone: reached, progress, remaining },
      is_read: false,
      action_url: '/goal',
      created_at: new Date().toISOString(),
    });
  }

  return notifications;
};
