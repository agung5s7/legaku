export type FamilyRole = 'owner' | 'partner';

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'other';

export type CategoryType = 'income' | 'expense';

export type TransactionType = 'income' | 'expense';

export type TransactionSource = 'manual' | 'receipt_ai' | 'voice_ai' | 'whatsapp' | 'import';

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  profile?: UserProfile;
}

export interface Account {
  id: string;
  family_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  family_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string;
  notes?: string | null;
  source: TransactionSource;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Enriched UI properties
  account_name?: string;
  category_name?: string;
  category_icon?: string;
  creator_name?: string;
}

export interface Goal {
  id: string;
  family_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  family_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon?: string;
  spent_amount?: number;
}

export interface FinancialHealthIndicator {
  status: 'healthy' | 'moderate' | 'attention';
  headline: string;
  detail: string;
  savingsRate: number;
  cashFlowRatio: number;
}

// ----------------------------------------------------------------------------
// Phase 2 Types: Receipts, Voice, AI Memory & Monthly Review
// ----------------------------------------------------------------------------

export type ReceiptProcessingStatus = 'uploaded' | 'processing' | 'ready' | 'confirmed' | 'failed';

export interface ReceiptItem {
  name: string;
  amount: number;
  quantity?: number;
}

export interface ReceiptConfidence {
  merchant: number;
  amount: number;
  date: number;
  category: number;
}

export interface Receipt {
  id: string;
  family_id: string;
  transaction_id?: string | null;
  uploaded_by?: string | null;
  storage_path: string;
  original_filename?: string;
  processing_status: ReceiptProcessingStatus;
  merchant_name?: string;
  extracted_amount?: number;
  extracted_date?: string;
  extracted_time?: string;
  extracted_items?: ReceiptItem[];
  suggested_category_id?: string;
  confidence?: ReceiptConfidence;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ReceiptExtractionResult {
  merchant_name: string;
  total_amount: number;
  transaction_date: string;
  transaction_time?: string;
  suggested_category_id?: string;
  suggested_category_name?: string;
  items: ReceiptItem[];
  confidence: ReceiptConfidence;
  is_confident: boolean;
  imageUrl?: string;
  raw_text?: string;
}

export interface VoiceParseResult {
  type: TransactionType;
  amount: number;
  description: string;
  suggested_category_id?: string;
  suggested_category_name?: string;
  suggested_category_icon?: string;
  account_id?: string;
  account_name?: string;
  date: string;
  confidence: number;
  raw_transcript: string;
}

export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiConversation {
  id: string;
  family_id: string;
  created_by?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  metadata?: {
    calculations?: { label: string; value: string }[];
    action_chips?: string[];
    insight_type?: string;
  };
  created_at: string;
}

export interface FinancialInsight {
  id: string;
  family_id: string;
  period_month: number;
  period_year: number;
  insight_type: 'spending_increase' | 'spending_decrease' | 'budget_alert' | 'goal_progress' | 'cashflow';
  title: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface CategorySpendingBreakdown {
  id: string;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyReviewData {
  month: number;
  year: number;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  prevMonthExpense: number;
  expenseChangePercentage: number;
  topCategories: CategorySpendingBreakdown[];
  budgetAlerts: { categoryName: string; budget: number; spent: number; percentage: number }[];
  goalHighlights: { name: string; progress: number; target: number; current: number }[];
  insights: FinancialInsight[];
}

// ----------------------------------------------------------------------------
// Phase 3 Types: Daily Intelligence & Family Automation
// ----------------------------------------------------------------------------

export interface Transfer {
  id: string;
  family_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transfer_date: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Enriched UI properties
  from_account_name?: string;
  to_account_name?: string;
  creator_name?: string;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurringTransaction {
  id: string;
  family_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id?: string | null;
  account_id?: string | null;
  frequency: RecurringFrequency;
  interval_value: number;
  next_occurrence: string;
  end_date?: string | null;
  is_active: boolean;
  auto_create: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Enriched UI properties
  category_name?: string;
  category_icon?: string;
  account_name?: string;
}

export interface TransactionTemplate {
  id: string;
  family_id: string;
  name: string;
  type: TransactionType;
  default_amount?: number | null;
  category_id?: string | null;
  account_id?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Enriched UI properties
  category_name?: string;
  category_icon?: string;
  account_name?: string;
}

export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'recurring_due'
  | 'goal_milestone'
  | 'unusual_transaction'
  | 'monthly_review'
  | 'family_activity'
  | 'system';

export interface NotificationItem {
  id: string;
  family_id: string;
  user_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  family_id?: string;
  budget_alerts: boolean;
  goal_milestones: boolean;
  recurring_reminders: boolean;
  unusual_alerts: boolean;
  family_activity: boolean;
}

export interface FamilyActivityItem {
  id: string;
  family_id: string;
  actor_id?: string | null;
  actor_name: string;
  action_type: string;
  entity_type: string;
  entity_id?: string | null;
  title: string;
  description?: string | null;
  created_at: string;
}

export interface CsvColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
  category?: string;
  account?: string;
  notes?: string;
}

export interface CsvRowValidation {
  rowIndex: number;
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
  parsed?: {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category_id: string;
    account_id: string;
    notes?: string;
  };
}

// ----------------------------------------------------------------------------
// Phase 4 Types: Growth, Monetization & Product Polish
// ----------------------------------------------------------------------------

export type PlanSlug = 'free' | 'plus' | 'family' | 'founder_lifetime';

export interface Plan {
  id: string;
  slug: PlanSlug;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  monthly_ai_limit: number;
  monthly_receipt_limit: number;
  monthly_voice_limit: number;
  features: string[];
  is_active: boolean;
}

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled' | 'lifetime';

export interface Subscription {
  id: string;
  user_id?: string | null;
  family_id?: string | null;
  plan_slug?: PlanSlug;
  plan?: Plan;
  status: SubscriptionStatus;
  started_at?: string;
  expires_at?: string | null;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  provider?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiUsageRecord {
  id: string;
  user_id?: string | null;
  family_id?: string | null;
  feature: 'companion' | 'receipt' | 'voice' | 'insight' | 'health_check';
  usage_date: string;
  request_count: number;
  token_usage?: number;
}

export interface SmartPattern {
  id: string;
  type?: 'recurring_spending' | 'end_of_month_spike' | 'category_trend' | 'savings_trend' | string;
  pattern_type?: string;
  title: string;
  description: string;
  confidence?: number;
  confidence_score?: number;
  suggested_action?: string;
  recommendation?: string;
  detected_at?: string;
}

export interface FinancialProfile {
  id: string;
  family_id: string;
  average_monthly_income: number;
  average_monthly_expense: number;
  average_savings_rate: number;
  essential_expense_estimate: number;
  emergency_fund_months: number;
  common_spending_categories: { name: string; percentage: number }[];
  recurring_commitments: string[];
  detected_patterns: SmartPattern[];
  updated_at: string;
}

export interface HealthMetricItem {
  key: string;
  label: string;
  value: string;
  status: 'optimal' | 'moderate' | 'attention';
  description: string;
}

export interface HealthActionSuggestion {
  id: string;
  title: string;
  impact: string;
  action_type: 'increase_emergency_fund' | 'reduce_category' | 'boost_goal';
  action_cta: string;
}

export interface FinancialHealthAssessment {
  overall_status: 'Sangat Sehat' | 'Cukup Stabil' | 'Perlu Penyesuaian';
  summary_headline: string;
  summary_detail: string;
  metrics: HealthMetricItem[];
  suggestions: HealthActionSuggestion[];
  assessed_at: string;
}

export interface ScenarioSimulationInput {
  additionalSavingsPerMonth: number;
  reducedExpensePerMonth: number;
  targetGoalId?: string;
}

export interface ScenarioSimulationResult {
  originalCompletionDate?: string;
  newCompletionDate?: string;
  monthsSaved: number;
  monthlyCashflowImpact: number;
  projectedYearEndBalance: number;
}

export type ProductEventName =
  | 'app_opened'
  | 'beta_invite_opened'
  | 'beta_signup_completed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'first_transaction'
  | 'first_transaction_created'
  | 'first_goal'
  | 'first_goal_created'
  | 'first_budget'
  | 'first_ai_question'
  | 'first_receipt_scan'
  | 'receipt_scanned'
  | 'first_voice_transaction'
  | 'voice_transaction_created'
  | 'partner_invited'
  | 'partner_joined'
  | 'monthly_review_opened'
  | 'financial_health_check_completed'
  | 'scenario_simulator_used'
  | 'scenario_simulation_used'
  | 'feedback_submitted'
  | 'export_used'
  | 'app_installed'
  | 'plan_upgraded';

export interface ProductEvent {
  id: string;
  user_id?: string | null;
  family_id?: string | null;
  event_name: ProductEventName;
  metadata?: Record<string, any>;
  created_at: string;
}
