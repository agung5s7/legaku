import {
  Budget,
  Goal,
  NotificationItem,
  NotificationPreferences,
  RecurringTransaction,
  Transaction,
} from '../../types';
import { evaluateBudgetNotifications } from './budgetNotifications';
import { evaluateGoalNotifications } from './goalNotifications';
import { evaluateRecurringNotifications } from './recurringNotifications';
import { evaluateAnomalyNotifications } from './anomalyNotifications';

interface EvaluationContext {
  familyId: string;
  budgets: Budget[];
  goals: Goal[];
  recurring: RecurringTransaction[];
  transactions: Transaction[];
  preferences: NotificationPreferences;
  existingNotifications: NotificationItem[];
}

export const runNotificationEngine = (context: EvaluationContext): NotificationItem[] => {
  const {
    familyId,
    budgets,
    goals,
    recurring,
    transactions,
    preferences,
    existingNotifications,
  } = context;

  const generated: NotificationItem[] = [];

  // 1. Budget notifications
  if (preferences.budget_alerts) {
    const budgetNotifs = evaluateBudgetNotifications(budgets, transactions, familyId);
    generated.push(...budgetNotifs);
  }

  // 2. Goal milestones
  if (preferences.goal_milestones) {
    const goalNotifs = evaluateGoalNotifications(goals, familyId);
    generated.push(...goalNotifs);
  }

  // 3. Recurring due reminders
  if (preferences.recurring_reminders) {
    const recNotifs = evaluateRecurringNotifications(recurring, familyId);
    generated.push(...recNotifs);
  }

  // 4. Unusual transaction notices
  if (preferences.unusual_alerts) {
    const anomalyNotifs = evaluateAnomalyNotifications(transactions, familyId);
    generated.push(...anomalyNotifs);
  }

  // Deduplicate against existing by ID
  const existingMap = new Map(existingNotifications.map((n) => [n.id, n]));
  const combined = [...existingNotifications];

  for (const item of generated) {
    if (!existingMap.has(item.id)) {
      combined.unshift(item);
      existingMap.set(item.id, item);
    }
  }

  return combined;
};
