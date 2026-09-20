import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Account,
  Category,
  FinancialHealthIndicator,
  Goal,
  Budget,
  Transaction,
  Transfer,
  RecurringTransaction,
  TransactionTemplate,
  NotificationItem,
  NotificationPreferences,
  FamilyActivityItem,
} from '../types';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  DEFAULT_CATEGORIES,
  DEMO_ACCOUNTS,
  DEMO_BUDGETS,
  DEMO_GOALS,
  DEMO_TRANSACTIONS,
  DEMO_TRANSFERS,
  DEMO_RECURRING_TRANSACTIONS,
  DEMO_TEMPLATES,
  DEMO_NOTIFICATIONS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEMO_ACTIVITIES,
} from '../lib/demoData';

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  transfers: Transfer[];
  recurringTransactions: RecurringTransaction[];
  templates: TransactionTemplate[];
  notifications: NotificationItem[];
  notificationPreferences: NotificationPreferences;
  activities: FamilyActivityItem[];
  loading: boolean;
  totalBalance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  remainingCashFlow: number;
  financialHealth: FinancialHealthIndicator;
  // Transactions
  addTransaction: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; transaction?: Transaction }>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<{ error?: string }>;
  deleteTransaction: (id: string) => Promise<{ error?: string }>;
  // Accounts
  addAccount: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; account?: Account }>;
  // Goals
  addGoal: (data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; goal?: Goal }>;
  updateGoalAmount: (id: string, additionalAmount: number) => Promise<{ error?: string }>;
  // Budgets
  setCategoryBudget: (categoryId: string, amount: number) => Promise<{ error?: string }>;
  // Transfers (Phase 3)
  addTransfer: (data: Omit<Transfer, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; transfer?: Transfer }>;
  deleteTransfer: (id: string) => Promise<{ error?: string }>;
  // Recurring (Phase 3)
  addRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; recurring?: RecurringTransaction }>;
  toggleRecurringActive: (id: string, isActive: boolean) => Promise<{ error?: string }>;
  deleteRecurringTransaction: (id: string) => Promise<{ error?: string }>;
  // Templates (Phase 3)
  addTemplate: (data: Omit<TransactionTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error?: string; template?: TransactionTemplate }>;
  deleteTemplate: (id: string) => Promise<{ error?: string }>;
  // Notifications (Phase 3)
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  // Family Activity (Phase 3)
  recordActivity: (actionType: string, entityType: string, title: string, description?: string, entityId?: string) => Promise<void>;
  refreshFinance: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// LocalStorage Keys for Offline / Demo Mode
const LOCAL_TX_KEY = 'legaku_transactions_store';
const LOCAL_ACC_KEY = 'legaku_accounts_store';
const LOCAL_GOAL_KEY = 'legaku_goals_store';
const LOCAL_BUDGET_KEY = 'legaku_budgets_store';
const LOCAL_TRF_KEY = 'legaku_transfers_store';
const LOCAL_REC_KEY = 'legaku_recurring_store';
const LOCAL_TPL_KEY = 'legaku_templates_store';
const LOCAL_NOTIF_KEY = 'legaku_notifications_store';
const LOCAL_PREF_KEY = 'legaku_notif_prefs_store';
const LOCAL_ACT_KEY = 'legaku_activities_store';

const isUuid = (str?: string | null): boolean =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isDemoMode } = useAuth();
  const { family, members } = useFamily();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [activities, setActivities] = useState<FamilyActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load finance data
  const loadFinanceData = useCallback(async () => {
    if (!family) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        // Accounts
        let { data: accs } = await supabase.from('accounts').select('*').eq('family_id', family.id).order('name');
        if ((!accs || accs.length === 0) && family.id) {
          try {
            const starterAccounts = [
              { family_id: family.id, name: 'Dompet Tunai', type: 'cash', initial_balance: 0, current_balance: 0 },
              { family_id: family.id, name: 'Rekening Bank Utama', type: 'bank', initial_balance: 0, current_balance: 0 },
              { family_id: family.id, name: 'E-Wallet', type: 'ewallet', initial_balance: 0, current_balance: 0 },
            ];
            const { data: insertedAccs } = await supabase.from('accounts').insert(starterAccounts).select();
            if (insertedAccs && insertedAccs.length > 0) accs = insertedAccs;
          } catch (accErr) {
            console.warn('Auto-seed accounts warning:', accErr);
          }
        }
        if (accs) setAccounts(accs as Account[]);

        // Categories (Auto-seed if empty in Supabase)
        let { data: cats } = await supabase.from('categories').select('*').or(`is_default.eq.true,family_id.eq.${family.id}`).order('name');
        if ((!cats || cats.length === 0) && family.id) {
          try {
            const defaultCatsToInsert = DEFAULT_CATEGORIES.map((c) => ({
              family_id: family.id,
              name: c.name,
              type: c.type,
              icon: c.icon,
              is_default: false,
            }));
            const { data: insertedCats } = await supabase.from('categories').insert(defaultCatsToInsert).select();
            if (insertedCats && insertedCats.length > 0) {
              cats = insertedCats;
            }
          } catch (catErr) {
            console.warn('Auto-seed categories warning:', catErr);
          }
        }
        if (cats && cats.length > 0) setCategories(cats as Category[]);
        else setCategories(DEFAULT_CATEGORIES);

        // Transactions
        const { data: txs } = await supabase.from('transactions').select('*').eq('family_id', family.id).order('transaction_date', { ascending: false });
        if (txs) setTransactions(txs as Transaction[]);

        // Goals
        const { data: gls } = await supabase.from('goals').select('*').eq('family_id', family.id).order('created_at', { ascending: false });
        if (gls) setGoals(gls as Goal[]);

        // Budgets
        const { data: bgts } = await supabase.from('budgets').select('*').eq('family_id', family.id);
        if (bgts) setBudgets(bgts as Budget[]);

        // Transfers (Phase 3)
        const { data: trfs } = await supabase.from('transfers').select('*').eq('family_id', family.id).order('transfer_date', { ascending: false });
        if (trfs) setTransfers(trfs as Transfer[]);

        // Recurring (Phase 3)
        const { data: recs } = await supabase.from('recurring_transactions').select('*').eq('family_id', family.id).order('next_occurrence', { ascending: true });
        if (recs) setRecurringTransactions(recs as RecurringTransaction[]);

        // Templates (Phase 3)
        const { data: tpls } = await supabase.from('transaction_templates').select('*').eq('family_id', family.id).order('name', { ascending: true });
        if (tpls && tpls.length > 0) setTemplates(tpls as TransactionTemplate[]);
        else setTemplates(DEMO_TEMPLATES);

        // Notifications (Phase 3)
        const { data: notifs } = await supabase.from('notifications').select('*').eq('family_id', family.id).order('created_at', { ascending: false });
        if (notifs) setNotifications(notifs as NotificationItem[]);

        // Notification Preferences (Phase 3)
        if (user) {
          const { data: prefs } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).eq('family_id', family.id).single();
          if (prefs) setNotificationPreferences(prefs as NotificationPreferences);
        }

        // Family Activity (Phase 3)
        const { data: acts } = await supabase.from('family_activity').select('*').eq('family_id', family.id).order('created_at', { ascending: false }).limit(50);
        if (acts) setActivities(acts as FamilyActivityItem[]);
      } catch (e) {
        console.warn('Error querying Supabase finance data:', e);
      }
    } else {
      // Local demo mode
      const savedAccs = localStorage.getItem(LOCAL_ACC_KEY);
      const savedTxs = localStorage.getItem(LOCAL_TX_KEY);
      const savedGoals = localStorage.getItem(LOCAL_GOAL_KEY);
      const savedBudgets = localStorage.getItem(LOCAL_BUDGET_KEY);
      const savedTrfs = localStorage.getItem(LOCAL_TRF_KEY);
      const savedRecs = localStorage.getItem(LOCAL_REC_KEY);
      const savedTpls = localStorage.getItem(LOCAL_TPL_KEY);
      const savedNotifs = localStorage.getItem(LOCAL_NOTIF_KEY);
      const savedPrefs = localStorage.getItem(LOCAL_PREF_KEY);
      const savedActs = localStorage.getItem(LOCAL_ACT_KEY);

      setAccounts(savedAccs ? JSON.parse(savedAccs) : DEMO_ACCOUNTS);
      setCategories(DEFAULT_CATEGORIES);
      setTransactions(savedTxs ? JSON.parse(savedTxs) : DEMO_TRANSACTIONS);
      setGoals(savedGoals ? JSON.parse(savedGoals) : DEMO_GOALS);
      setBudgets(savedBudgets ? JSON.parse(savedBudgets) : DEMO_BUDGETS);
      setTransfers(savedTrfs ? JSON.parse(savedTrfs) : DEMO_TRANSFERS);
      setRecurringTransactions(savedRecs ? JSON.parse(savedRecs) : DEMO_RECURRING_TRANSACTIONS);
      setTemplates(savedTpls ? JSON.parse(savedTpls) : DEMO_TEMPLATES);
      setNotifications(savedNotifs ? JSON.parse(savedNotifs) : DEMO_NOTIFICATIONS);
      setNotificationPreferences(savedPrefs ? JSON.parse(savedPrefs) : DEFAULT_NOTIFICATION_PREFERENCES);
      setActivities(savedActs ? JSON.parse(savedActs) : DEMO_ACTIVITIES);
    }

    setLoading(false);
  }, [family, isDemoMode, user]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Centralized Supabase Realtime Subscription (Phase 1, 2 & 3 tables)
  useEffect(() => {
    if (!isSupabaseConfigured || isDemoMode || !family?.id) return;

    const channel = supabase
      .channel(`family-${family.id}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_transactions', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_activity', filter: `family_id=eq.${family.id}` }, () => loadFinanceData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [family?.id, isDemoMode, loadFinanceData]);

  // Enriched Transactions with Account & Category Info & Creator
  const enrichedTransactions = useMemo(() => {
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const catMap = new Map(categories.map((c) => [c.id, { name: c.name, icon: c.icon }]));
    const memberMap = new Map((members || []).map((m) => [m.user_id, m.profile?.full_name]));

    return transactions.map((tx) => {
      const catInfo = catMap.get(tx.category_id);
      const memberName = tx.created_by
        ? (memberMap.get(tx.created_by) || (tx.created_by === user?.id ? profile?.full_name : undefined))
        : undefined;

      return {
        ...tx,
        account_name: accMap.get(tx.account_id) || tx.account_name || 'Akun Lainnya',
        category_name: catInfo?.name || tx.category_name || 'Lainnya',
        category_icon: catInfo?.icon || tx.category_icon || 'Tag',
        creator_name: tx.creator_name || memberName || 'Keluarga',
      };
    });
  }, [transactions, accounts, categories, members, user?.id, profile?.full_name]);

  // Enriched Transfers with Account Names & Creator
  const enrichedTransfers = useMemo(() => {
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const memberMap = new Map((members || []).map((m) => [m.user_id, m.profile?.full_name]));

    return transfers.map((trf) => {
      const memberName = trf.created_by
        ? (memberMap.get(trf.created_by) || (trf.created_by === user?.id ? profile?.full_name : undefined))
        : undefined;

      return {
        ...trf,
        from_account_name: accMap.get(trf.from_account_id) || trf.from_account_name || 'Akun Asal',
        to_account_name: accMap.get(trf.to_account_id) || trf.to_account_name || 'Akun Tujuan',
        creator_name: trf.creator_name || memberName || 'Keluarga',
      };
    });
  }, [transfers, accounts, members, user?.id, profile?.full_name]);

  // Enriched Recurring Transactions
  const enrichedRecurring = useMemo(() => {
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const catMap = new Map(categories.map((c) => [c.id, { name: c.name, icon: c.icon }]));
    return recurringTransactions.map((rec) => ({
      ...rec,
      account_name: rec.account_id ? accMap.get(rec.account_id) || 'Akun Terhubung' : undefined,
      category_name: rec.category_id ? catMap.get(rec.category_id)?.name || 'Tagihan' : undefined,
      category_icon: rec.category_id ? catMap.get(rec.category_id)?.icon || 'Receipt' : undefined,
    }));
  }, [recurringTransactions, accounts, categories]);

  // Enriched Templates
  const enrichedTemplates = useMemo(() => {
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const catMap = new Map(categories.map((c) => [c.id, { name: c.name, icon: c.icon }]));
    return templates.map((tpl) => ({
      ...tpl,
      account_name: tpl.account_id ? accMap.get(tpl.account_id) : undefined,
      category_name: tpl.category_id ? catMap.get(tpl.category_id)?.name : undefined,
      category_icon: tpl.category_id ? catMap.get(tpl.category_id)?.icon : undefined,
    }));
  }, [templates, accounts, categories]);

  // Financial Overview Aggregations (Transfers are strictly excluded from income/expense)
  const { totalBalance, incomeThisMonth, expenseThisMonth, remainingCashFlow, financialHealth } = useMemo(() => {
    const totalBal = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let inc = 0;
    let exp = 0;

    for (const tx of transactions) {
      const txDate = new Date(tx.transaction_date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (tx.type === 'income') {
          inc += Number(tx.amount);
        } else {
          exp += Number(tx.amount);
        }
      }
    }

    const net = inc - exp;
    const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
    const cashFlowRatio = exp > 0 ? inc / exp : 1;

    let health: FinancialHealthIndicator = {
      status: 'healthy',
      headline: 'Keuangan keluarga terlihat seimbang dan tenang',
      detail: 'Pemasukan bulan ini melampaui pengeluaran dengan porsi tabungan yang memadai.',
      savingsRate: Math.max(0, Math.round(savingsRate)),
      cashFlowRatio: Number(cashFlowRatio.toFixed(1)),
    };

    if (inc === 0 && exp === 0) {
      health = {
        status: 'healthy',
        headline: 'Mulai pencatatan bulan ini dengan tenang',
        detail: 'Belum ada transaksi besar tercatat di bulan ini.',
        savingsRate: 0,
        cashFlowRatio: 1,
      };
    } else if (net < 0) {
      health = {
        status: 'attention',
        headline: 'Pengeluaran bulan ini sedikit melebihi pemasukan',
        detail: 'Yuk, lihat bersama kategori apa yang sedang meningkat bulan ini untuk penyesuaian.',
        savingsRate: 0,
        cashFlowRatio: Number(cashFlowRatio.toFixed(1)),
      };
    } else if (savingsRate < 10) {
      health = {
        status: 'moderate',
        headline: 'Cash flow keluarga positif dan terkendali',
        detail: 'Ada sisa dana yang bisa dialokasikan perlahan ke dana darurat atau tabungan bersama.',
        savingsRate: Math.round(savingsRate),
        cashFlowRatio: Number(cashFlowRatio.toFixed(1)),
      };
    }

    return {
      totalBalance: totalBal,
      incomeThisMonth: inc,
      expenseThisMonth: exp,
      remainingCashFlow: net,
      financialHealth: health,
    };
  }, [accounts, transactions]);

  // Record Family Activity Helper
  const recordActivity = async (
    actionType: string,
    entityType: string,
    title: string,
    description?: string,
    entityId?: string
  ): Promise<void> => {
    if (!family) return;

    const newActivity: FamilyActivityItem = {
      id: `act-${Date.now()}`,
      family_id: family.id,
      actor_id: user?.id || null,
      actor_name: profile?.full_name || 'Anggota Keluarga',
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId || null,
      title,
      description: description || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        await supabase.from('family_activity').insert({
          family_id: family.id,
          actor_id: user?.id || null,
          actor_name: profile?.full_name || 'Anggota Keluarga',
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId || null,
          title,
          description: description || null,
        });
      } catch (e) {
        console.warn('Failed recording activity to Supabase:', e);
      }
    } else {
      const updated = [newActivity, ...activities].slice(0, 50);
      setActivities(updated);
      localStorage.setItem(LOCAL_ACT_KEY, JSON.stringify(updated));
    }
  };

  // Add Transaction
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: string; transaction?: Transaction }> => {
    if (!family) return { error: 'Keluarga belum aktif' };

    // Strip client-side enriched properties before sending payload to DB
    const {
      creator_name,
      account_name,
      category_name,
      category_icon,
      ...dbData
    } = data as any;

    const newTxPayload = {
      ...dbData,
      family_id: family.id,
      created_by: user?.id || null,
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        // Self-heal: Resolve category_id if dummy non-UUID (e.g. 'cat-exp-2') was provided
        if (!isUuid(newTxPayload.category_id)) {
          const dummyCat = DEFAULT_CATEGORIES.find((c) => c.id === newTxPayload.category_id);
          const targetName = dummyCat?.name || category_name;

          // 1. Look in loaded categories state
          let validCat = categories.find((c) => isUuid(c.id) && c.name.toLowerCase() === targetName?.toLowerCase());
          if (!validCat) {
            validCat = categories.find((c) => isUuid(c.id) && c.type === (data.type || 'expense'));
          }

          if (validCat) {
            newTxPayload.category_id = validCat.id;
          } else {
            // 2. Query Supabase directly or create this category on the fly
            const { data: dbCat } = await supabase
              .from('categories')
              .select('id')
              .or(`is_default.eq.true,family_id.eq.${family.id}`)
              .ilike('name', targetName || 'Lainnya')
              .limit(1)
              .maybeSingle();

            if (dbCat && isUuid(dbCat.id)) {
              newTxPayload.category_id = dbCat.id;
            } else {
              const { data: createdCat } = await supabase
                .from('categories')
                .insert({
                  family_id: family.id,
                  name: targetName || (data.type === 'income' ? 'Pemasukan Lainnya' : 'Pengeluaran Lainnya'),
                  type: data.type || 'expense',
                  icon: dummyCat?.icon || 'Tag',
                  is_default: false,
                })
                .select('id')
                .single();

              if (createdCat && isUuid(createdCat.id)) {
                newTxPayload.category_id = createdCat.id;
                loadFinanceData();
              }
            }
          }
        }

        // Self-heal: Resolve account_id if dummy non-UUID was provided
        if (!isUuid(newTxPayload.account_id)) {
          const validAcc = accounts.find((a) => isUuid(a.id));
          if (validAcc) {
            newTxPayload.account_id = validAcc.id;
          } else {
            const { data: dbAcc } = await supabase
              .from('accounts')
              .select('id')
              .eq('family_id', family.id)
              .limit(1)
              .maybeSingle();
            if (dbAcc && isUuid(dbAcc.id)) {
              newTxPayload.account_id = dbAcc.id;
            }
          }
        }

        const { data: created, error } = await supabase.from('transactions').insert(newTxPayload).select().single();
        if (error || !created) return { error: error?.message || 'Gagal menyimpan transaksi' };
        await recordActivity(
          'transaction_created',
          'transaction',
          `${profile?.full_name || 'Keluarga'} mencatat ${data.description}`,
          `${data.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'} Rp ${data.amount.toLocaleString('id-ID')}`,
          created.id
        );
        await loadFinanceData();
        return {
          transaction: {
            ...(created as Transaction),
            creator_name: creator_name || profile?.full_name || 'Keluarga',
          },
        };
      } catch (err: any) {
        return { error: err?.message || 'Terjadi kesalahan sistem' };
      }
    } else {
      const newTx: Transaction = {
        ...newTxPayload,
        id: `tx-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_name: creator_name || profile?.full_name || 'Anggota Keluarga',
      };

      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updatedTxs));

      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === newTx.account_id) {
          const delta = newTx.type === 'income' ? Number(newTx.amount) : -Number(newTx.amount);
          return {
            ...acc,
            current_balance: Number(acc.current_balance) + delta,
            updated_at: new Date().toISOString(),
          };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(updatedAccounts));

      await recordActivity(
        'transaction_created',
        'transaction',
        `${profile?.full_name || 'Keluarga'} mencatat ${data.description}`,
        `${data.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'} Rp ${data.amount.toLocaleString('id-ID')}`,
        newTx.id
      );

      return { transaction: newTx };
    }
  };

  // Update Transaction
  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const {
          creator_name,
          account_name,
          category_name,
          category_icon,
          ...dbUpdates
        } = updates as any;
        const { error } = await supabase.from('transactions').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal mengubah transaksi' };
      }
    } else {
      const oldTx = transactions.find((t) => t.id === id);
      if (!oldTx) return { error: 'Transaksi tidak ditemukan' };

      const updatedTx = { ...oldTx, ...updates, updated_at: new Date().toISOString() };
      const updatedTxs = transactions.map((t) => (t.id === id ? updatedTx : t));
      setTransactions(updatedTxs);
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updatedTxs));

      const updatedAccounts = accounts.map((acc) => {
        let newBalance = Number(acc.current_balance);
        if (acc.id === oldTx.account_id) {
          newBalance += oldTx.type === 'income' ? -Number(oldTx.amount) : Number(oldTx.amount);
        }
        if (acc.id === updatedTx.account_id) {
          newBalance += updatedTx.type === 'income' ? Number(updatedTx.amount) : -Number(updatedTx.amount);
        }
        return { ...acc, current_balance: newBalance };
      });

      setAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(updatedAccounts));
      return {};
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal menghapus transaksi' };
      }
    } else {
      const oldTx = transactions.find((t) => t.id === id);
      if (!oldTx) return { error: 'Transaksi tidak ditemukan' };

      const updatedTxs = transactions.filter((t) => t.id !== id);
      setTransactions(updatedTxs);
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(updatedTxs));

      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === oldTx.account_id) {
          const delta = oldTx.type === 'income' ? -Number(oldTx.amount) : Number(oldTx.amount);
          return { ...acc, current_balance: Number(acc.current_balance) + delta };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(updatedAccounts));
      return {};
    }
  };

  // ----------------------------------------------------------------------------
  // Transfers (Phase 3)
  // Distinct first-class entity. Does NOT change total family wealth.
  // ----------------------------------------------------------------------------
  const addTransfer = async (
    data: Omit<Transfer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: string; transfer?: Transfer }> => {
    if (!family) return { error: 'Keluarga belum aktif' };
    if (data.from_account_id === data.to_account_id) {
      return { error: 'Rekening asal dan tujuan tidak boleh sama' };
    }
    if (data.amount <= 0) {
      return { error: 'Nominal transfer harus lebih dari 0' };
    }

    const {
      from_account_name,
      to_account_name,
      creator_name,
      ...dbData
    } = data as any;

    const payload = {
      ...dbData,
      family_id: family.id,
      created_by: user?.id || null,
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        if (!isUuid(payload.from_account_id) || !isUuid(payload.to_account_id)) {
          const validAccs = accounts.filter((a) => isUuid(a.id));
          if (validAccs.length >= 2) {
            if (!isUuid(payload.from_account_id)) payload.from_account_id = validAccs[0].id;
            if (!isUuid(payload.to_account_id)) payload.to_account_id = validAccs[1].id;
          }
        }
        const { data: created, error } = await supabase.from('transfers').insert(payload).select().single();
        if (error || !created) return { error: error?.message || 'Gagal menyimpan transfer' };

        const fromAcc = accounts.find((a) => a.id === data.from_account_id);
        const toAcc = accounts.find((a) => a.id === data.to_account_id);
        await recordActivity(
          'transfer_created',
          'transfer',
          `${profile?.full_name || 'Keluarga'} memindahkan dana`,
          `Transfer Rp ${data.amount.toLocaleString('id-ID')} dari ${fromAcc?.name || 'Rekening Asal'} ke ${toAcc?.name || 'Rekening Tujuan'}`,
          created.id
        );

        await loadFinanceData();
        return { transfer: created as Transfer };
      } catch (e: any) {
        return { error: e?.message || 'Gagal menyimpan transfer' };
      }
    } else {
      const fromAcc = accounts.find((a) => a.id === data.from_account_id);
      const toAcc = accounts.find((a) => a.id === data.to_account_id);

      const newTrf: Transfer = {
        ...payload,
        id: `trf-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        from_account_name: fromAcc?.name || 'Akun Asal',
        to_account_name: toAcc?.name || 'Akun Tujuan',
        creator_name: profile?.full_name || 'Anggota Keluarga',
      };

      const updatedTrfs = [newTrf, ...transfers];
      setTransfers(updatedTrfs);
      localStorage.setItem(LOCAL_TRF_KEY, JSON.stringify(updatedTrfs));

      // Adjust from_account and to_account balances
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === data.from_account_id) {
          return { ...acc, current_balance: Number(acc.current_balance) - Number(data.amount) };
        }
        if (acc.id === data.to_account_id) {
          return { ...acc, current_balance: Number(acc.current_balance) + Number(data.amount) };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(updatedAccounts));

      await recordActivity(
        'transfer_created',
        'transfer',
        `${profile?.full_name || 'Keluarga'} memindahkan dana`,
        `Transfer Rp ${data.amount.toLocaleString('id-ID')} dari ${fromAcc?.name || 'Rekening Asal'} ke ${toAcc?.name || 'Rekening Tujuan'}`,
        newTrf.id
      );

      return { transfer: newTrf };
    }
  };

  const deleteTransfer = async (id: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('transfers').delete().eq('id', id);
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal menghapus transfer' };
      }
    } else {
      const oldTrf = transfers.find((t) => t.id === id);
      if (!oldTrf) return { error: 'Data transfer tidak ditemukan' };

      const updatedTrfs = transfers.filter((t) => t.id !== id);
      setTransfers(updatedTrfs);
      localStorage.setItem(LOCAL_TRF_KEY, JSON.stringify(updatedTrfs));

      // Reverse account balances
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === oldTrf.from_account_id) {
          return { ...acc, current_balance: Number(acc.current_balance) + Number(oldTrf.amount) };
        }
        if (acc.id === oldTrf.to_account_id) {
          return { ...acc, current_balance: Number(acc.current_balance) - Number(oldTrf.amount) };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(updatedAccounts));
      return {};
    }
  };

  // ----------------------------------------------------------------------------
  // Recurring Transactions (Phase 3)
  // ----------------------------------------------------------------------------
  const addRecurringTransaction = async (
    data: Omit<RecurringTransaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: string; recurring?: RecurringTransaction }> => {
    if (!family) return { error: 'Keluarga belum aktif' };

    const {
      account_name,
      category_name,
      category_icon,
      ...dbData
    } = data as any;

    const payload = {
      ...dbData,
      family_id: family.id,
      created_by: user?.id || null,
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { data: created, error } = await supabase.from('recurring_transactions').insert(payload).select().single();
        if (error || !created) return { error: error?.message || 'Gagal menyimpan transaksi berulang' };
        await loadFinanceData();
        return { recurring: created as RecurringTransaction };
      } catch (e: any) {
        return { error: e?.message || 'Gagal menyimpan transaksi berulang' };
      }
    } else {
      const newRec: RecurringTransaction = {
        ...payload,
        id: `rec-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [newRec, ...recurringTransactions];
      setRecurringTransactions(updated);
      localStorage.setItem(LOCAL_REC_KEY, JSON.stringify(updated));
      return { recurring: newRec };
    }
  };

  const toggleRecurringActive = async (id: string, isActive: boolean): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('recurring_transactions').update({ is_active: isActive }).eq('id', id);
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal memperbarui status transaksi berulang' };
      }
    } else {
      const updated = recurringTransactions.map((r) => (r.id === id ? { ...r, is_active: isActive } : r));
      setRecurringTransactions(updated);
      localStorage.setItem(LOCAL_REC_KEY, JSON.stringify(updated));
      return {};
    }
  };

  const deleteRecurringTransaction = async (id: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal menghapus transaksi berulang' };
      }
    } else {
      const updated = recurringTransactions.filter((r) => r.id !== id);
      setRecurringTransactions(updated);
      localStorage.setItem(LOCAL_REC_KEY, JSON.stringify(updated));
      return {};
    }
  };

  // ----------------------------------------------------------------------------
  // Transaction Templates (Phase 3)
  // ----------------------------------------------------------------------------
  const addTemplate = async (
    data: Omit<TransactionTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: string; template?: TransactionTemplate }> => {
    if (!family) return { error: 'Keluarga belum aktif' };

    const {
      account_name,
      category_name,
      category_icon,
      ...dbData
    } = data as any;

    const payload = {
      ...dbData,
      family_id: family.id,
      created_by: user?.id || null,
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { data: created, error } = await supabase.from('transaction_templates').insert(payload).select().single();
        if (error || !created) return { error: error?.message || 'Gagal menyimpan template' };
        await loadFinanceData();
        return { template: created as TransactionTemplate };
      } catch (e: any) {
        return { error: e?.message || 'Gagal menyimpan template' };
      }
    } else {
      const newTpl: TransactionTemplate = {
        ...payload,
        id: `tpl-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newTpl, ...templates];
      setTemplates(updated);
      localStorage.setItem(LOCAL_TPL_KEY, JSON.stringify(updated));
      return { template: newTpl };
    }
  };

  const deleteTemplate = async (id: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('transaction_templates').delete().eq('id', id);
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal menghapus template' };
      }
    } else {
      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      localStorage.setItem(LOCAL_TPL_KEY, JSON.stringify(updated));
      return {};
    }
  };

  // ----------------------------------------------------------------------------
  // Notifications & Preferences (Phase 3)
  // ----------------------------------------------------------------------------
  const markNotificationAsRead = async (id: string): Promise<void> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        console.warn('Failed marking notification read on Supabase:', e);
      }
    }
    const updated = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setNotifications(updated);
    localStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(updated));
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    if (isSupabaseConfigured && !isDemoMode && family?.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('family_id', family.id);
      } catch (e) {
        console.warn('Failed marking all notifications read on Supabase:', e);
      }
    }
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    setNotifications(updated);
    localStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(updated));
  };

  const updateNotificationPreferences = async (prefs: Partial<NotificationPreferences>): Promise<void> => {
    const updated = { ...notificationPreferences, ...prefs };
    setNotificationPreferences(updated);
    localStorage.setItem(LOCAL_PREF_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && !isDemoMode && user?.id && family?.id) {
      try {
        await supabase.from('notification_preferences').upsert({
          user_id: user.id,
          family_id: family.id,
          ...updated,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed updating notification preferences on Supabase:', e);
      }
    }
  };

  // ----------------------------------------------------------------------------
  // Accounts, Goals & Budgets (Phase 1)
  // ----------------------------------------------------------------------------
  const addAccount = async (
    data: Omit<Account, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: string; account?: Account }> => {
    if (!family) return { error: 'Keluarga belum aktif' };

    const payload = {
      ...data,
      family_id: family.id,
      current_balance: data.initial_balance || 0,
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { data: created, error } = await supabase.from('accounts').insert(payload).select().single();
        if (error || !created) return { error: error?.message || 'Gagal menambah rekening' };
        await loadFinanceData();
        return { account: created as Account };
      } catch (err: any) {
        return { error: err?.message || 'Terjadi kesalahan' };
      }
    } else {
      const newAcc: Account = {
        ...payload,
        id: `acc-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedAccounts = [...accounts, newAcc];
      setAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_ACC_KEY, JSON.stringify(updatedAccounts));
      return { account: newAcc };
    }
  };

  const addGoal = async (
    data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error?: string; goal?: Goal }> => {
    if (!family) return { error: 'Keluarga belum aktif' };

    const payload = {
      ...data,
      family_id: family.id,
      created_by: user?.id || null,
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { data: created, error } = await supabase.from('goals').insert(payload).select().single();
        if (error || !created) return { error: error?.message || 'Gagal menambah target' };
        await recordActivity('goal_created', 'goal', `${profile?.full_name || 'Keluarga'} membuat target baru`, data.name, created.id);
        await loadFinanceData();
        return { goal: created as Goal };
      } catch (err: any) {
        return { error: err?.message || 'Terjadi kesalahan' };
      }
    } else {
      const newGoal: Goal = {
        ...payload,
        id: `goal-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);
      localStorage.setItem(LOCAL_GOAL_KEY, JSON.stringify(updatedGoals));
      await recordActivity('goal_created', 'goal', `${profile?.full_name || 'Keluarga'} membuat target baru`, data.name, newGoal.id);
      return { goal: newGoal };
    }
  };

  const updateGoalAmount = async (id: string, additionalAmount: number): Promise<{ error?: string }> => {
    const target = goals.find((g) => g.id === id);
    if (!target) return { error: 'Target impian tidak ditemukan' };
    const newAmount = Number(target.current_amount) + Number(additionalAmount);

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('goals').update({ current_amount: newAmount, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return { error: error.message };
        await recordActivity('goal_updated', 'goal', `${profile?.full_name || 'Keluarga'} menambah tabungan target`, `${target.name} (+Rp ${additionalAmount.toLocaleString('id-ID')})`, id);
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal mengupdate target' };
      }
    } else {
      const updatedGoals = goals.map((g) => (g.id === id ? { ...g, current_amount: newAmount, updated_at: new Date().toISOString() } : g));
      setGoals(updatedGoals);
      localStorage.setItem(LOCAL_GOAL_KEY, JSON.stringify(updatedGoals));
      await recordActivity('goal_updated', 'goal', `${profile?.full_name || 'Keluarga'} menambah tabungan target`, `${target.name} (+Rp ${additionalAmount.toLocaleString('id-ID')})`, id);
      return {};
    }
  };

  const setCategoryBudget = async (categoryId: string, amount: number): Promise<{ error?: string }> => {
    if (!family) return { error: 'Keluarga belum aktif' };

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase.from('budgets').upsert(
          {
            family_id: family.id,
            category_id: categoryId,
            month,
            year,
            amount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'family_id,category_id,month,year' }
        );
        if (error) return { error: error.message };
        await loadFinanceData();
        return {};
      } catch (e: any) {
        return { error: e?.message || 'Gagal menyimpan anggaran' };
      }
    } else {
      const existing = budgets.find((b) => b.category_id === categoryId && b.month === month && b.year === year);
      let updated: Budget[];
      if (existing) {
        updated = budgets.map((b) => (b.id === existing.id ? { ...b, amount, updated_at: new Date().toISOString() } : b));
      } else {
        const cat = categories.find((c) => c.id === categoryId);
        const newBudget: Budget = {
          id: `bgt-${Date.now()}`,
          family_id: family.id,
          category_id: categoryId,
          amount,
          month,
          year,
          category_name: cat?.name,
          category_icon: cat?.icon,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updated = [...budgets, newBudget];
      }

      setBudgets(updated);
      localStorage.setItem(LOCAL_BUDGET_KEY, JSON.stringify(updated));
      return {};
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions: enrichedTransactions,
        goals,
        budgets,
        transfers: enrichedTransfers,
        recurringTransactions: enrichedRecurring,
        templates: enrichedTemplates,
        notifications,
        notificationPreferences,
        activities,
        loading,
        totalBalance,
        incomeThisMonth,
        expenseThisMonth,
        remainingCashFlow,
        financialHealth,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        addGoal,
        updateGoalAmount,
        setCategoryBudget,
        addTransfer,
        deleteTransfer,
        addRecurringTransaction,
        toggleRecurringActive,
        deleteRecurringTransaction,
        addTemplate,
        deleteTemplate,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateNotificationPreferences,
        recordActivity,
        refreshFinance: loadFinanceData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
