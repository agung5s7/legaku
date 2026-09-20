import { Goal, ScenarioSimulationInput, ScenarioSimulationResult } from '../../types';

export interface RunScenarioSimulationOptions {
  extraMonthlySavings: number;
  reducedExpenseMonthly: number;
  oneTimeBoost?: number;
  baseMonthlySavings?: number;
}

export interface RunScenarioSimulationResult {
  baseMonthsNeeded: number;
  simulatedMonthsNeeded: number;
  monthsSaved: number;
  baseEstimatedDate: Date;
  simulatedEstimatedDate: Date;
  narrativeExplanation: string;
}

export function runScenarioSimulation(
  goal: Goal | undefined,
  options: RunScenarioSimulationOptions
): RunScenarioSimulationResult {
  const {
    extraMonthlySavings = 0,
    reducedExpenseMonthly = 0,
    oneTimeBoost = 0,
    baseMonthlySavings = 1000000,
  } = options;

  const targetAmount = goal?.target_amount || 20000000;
  const currentAmount = goal?.current_amount || 0;
  const remainingTarget = Math.max(0, targetAmount - currentAmount);

  // Baseline scenario
  const effectiveBaseMonthly = Math.max(250000, baseMonthlySavings);
  const baseMonthsNeeded = Math.ceil(remainingTarget / effectiveBaseMonthly);

  // Simulated scenario
  const remainingAfterOneTime = Math.max(0, remainingTarget - oneTimeBoost);
  const totalSimulatedMonthly = effectiveBaseMonthly + extraMonthlySavings + reducedExpenseMonthly;
  const simulatedMonthsNeeded = Math.ceil(remainingAfterOneTime / Math.max(100000, totalSimulatedMonthly));

  const monthsSaved = Math.max(0, baseMonthsNeeded - simulatedMonthsNeeded);

  const now = new Date();
  const baseEstimatedDate = new Date(now.getFullYear(), now.getMonth() + baseMonthsNeeded, 1);
  const simulatedEstimatedDate = new Date(now.getFullYear(), now.getMonth() + simulatedMonthsNeeded, 1);

  let narrativeExplanation = '';
  if (monthsSaved > 0) {
    narrativeExplanation = `Dengan komitmen ekstra tabungan Rp ${(extraMonthlySavings + reducedExpenseMonthly).toLocaleString('id-ID')} per bulan${
      oneTimeBoost > 0 ? ` dan dorongan dana kaget Rp ${oneTimeBoost.toLocaleString('id-ID')}` : ''
    }, impian "${goal?.name || 'Keluarga'}" dapat tercapai ${monthsSaved} bulan lebih cepat tanpa mengorbankan ketenangan arus kas harian.`;
  } else {
    narrativeExplanation = `Rencana saat ini berjalan stabil. Setiap rupiah tambahan yang dialokasikan akan langsung mempercepat kepastian tanggal tercapainya impian keluarga.`;
  }

  return {
    baseMonthsNeeded,
    simulatedMonthsNeeded,
    monthsSaved,
    baseEstimatedDate,
    simulatedEstimatedDate,
    narrativeExplanation,
  };
}

export class ScenarioSimulatorService {
  public static simulate(
    goal: Goal | undefined,
    currentCashflow: number,
    inputs: ScenarioSimulationInput
  ): ScenarioSimulationResult {
    const { additionalSavingsPerMonth, reducedExpensePerMonth } = inputs;
    const totalExtra = additionalSavingsPerMonth + reducedExpensePerMonth;

    let originalDateStr = goal?.target_date || 'Desember 2026';
    let newDateStr = originalDateStr;
    let monthsSaved = 0;

    if (goal && goal.target_amount > goal.current_amount) {
      const remainingTarget = goal.target_amount - goal.current_amount;
      const baselineMonthly = Math.max(500000, Math.round(remainingTarget / 12));
      const originalMonths = Math.ceil(remainingTarget / baselineMonthly);

      const newMonthly = baselineMonthly + totalExtra;
      const newMonths = Math.ceil(remainingTarget / newMonthly);

      monthsSaved = Math.max(0, originalMonths - newMonths);

      const now = new Date();
      const origDate = new Date();
      origDate.setMonth(now.getMonth() + originalMonths);

      const newDate = new Date();
      newDate.setMonth(now.getMonth() + newMonths);

      const formatMonthYear = (d: Date) =>
        new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);

      originalDateStr = formatMonthYear(origDate);
      newDateStr = formatMonthYear(newDate);
    }

    const projectedYearEndBalance = Math.max(0, currentCashflow * 12 + totalExtra * 12);

    return {
      originalCompletionDate: originalDateStr,
      newCompletionDate: newDateStr,
      monthsSaved,
      monthlyCashflowImpact: totalExtra,
      projectedYearEndBalance,
    };
  }
}
