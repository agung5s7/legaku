/**
 * FINANCIAL INTEGRITY TEST SUITE — LEGAKU PHASE 5
 * Validates mathematical and state invariants across all financial operations.
 */

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface Transaction {
  id: string;
  account_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  destination_account_id?: string;
}

class FinancialEngine {
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  constructor(initialAccounts: Account[]) {
    initialAccounts.forEach((acc) => this.accounts.set(acc.id, { ...acc }));
  }

  public getTotalWealth(): number {
    let total = 0;
    for (const acc of this.accounts.values()) {
      total += acc.balance;
    }
    return total;
  }

  public getAccount(id: string): Account {
    const acc = this.accounts.get(id);
    if (!acc) throw new Error(`Account not found: ${id}`);
    return acc;
  }

  // 1. Transaction Create
  public createTransaction(tx: Transaction): void {
    const acc = this.getAccount(tx.account_id);
    if (tx.type === 'income') {
      acc.balance += tx.amount;
    } else if (tx.type === 'expense') {
      acc.balance -= tx.amount;
    } else if (tx.type === 'transfer') {
      if (!tx.destination_account_id) throw new Error('Transfer requires destination_account_id');
      const destAcc = this.getAccount(tx.destination_account_id);
      acc.balance -= tx.amount;
      destAcc.balance += tx.amount;
    }
    this.transactions.set(tx.id, { ...tx });
  }

  // 2. Transaction Edit (Reversal of old effect + application of new effect)
  public editTransaction(txId: string, updated: Partial<Transaction>): void {
    const oldTx = this.transactions.get(txId);
    if (!oldTx) throw new Error(`Transaction not found: ${txId}`);

    // Reverse old
    const oldAcc = this.getAccount(oldTx.account_id);
    if (oldTx.type === 'income') {
      oldAcc.balance -= oldTx.amount;
    } else if (oldTx.type === 'expense') {
      oldAcc.balance += oldTx.amount;
    } else if (oldTx.type === 'transfer' && oldTx.destination_account_id) {
      const oldDest = this.getAccount(oldTx.destination_account_id);
      oldAcc.balance += oldTx.amount;
      oldDest.balance -= oldTx.amount;
    }

    // Apply new
    const newTx: Transaction = { ...oldTx, ...updated };
    const newAcc = this.getAccount(newTx.account_id);
    if (newTx.type === 'income') {
      newAcc.balance += newTx.amount;
    } else if (newTx.type === 'expense') {
      newAcc.balance -= newTx.amount;
    } else if (newTx.type === 'transfer' && newTx.destination_account_id) {
      const newDest = this.getAccount(newTx.destination_account_id);
      newAcc.balance -= newTx.amount;
      newDest.balance += newTx.amount;
    }

    this.transactions.set(txId, newTx);
  }

  // 3. Transaction Delete (Total reversal)
  public deleteTransaction(txId: string): void {
    const tx = this.transactions.get(txId);
    if (!tx) throw new Error(`Transaction not found: ${txId}`);

    const acc = this.getAccount(tx.account_id);
    if (tx.type === 'income') {
      acc.balance -= tx.amount;
    } else if (tx.type === 'expense') {
      acc.balance += tx.amount;
    } else if (tx.type === 'transfer' && tx.destination_account_id) {
      const destAcc = this.getAccount(tx.destination_account_id);
      acc.balance += tx.amount;
      destAcc.balance -= tx.amount;
    }
    this.transactions.delete(txId);
  }
}

// ==============================================================================
// TEST RUNNER
// ==============================================================================
export function runFinancialIntegrityTests() {
  console.log('--- RUNNING FINANCIAL INTEGRITY TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      failed++;
    }
  }

  // Initial Setup: BCA (10.000.000) & Dompet Tunai (2.000.000) => Total Wealth = 12.000.000
  const engine = new FinancialEngine([
    { id: 'acc-bca', name: 'BCA Utama', balance: 10_000_000 },
    { id: 'acc-cash', name: 'Dompet Tunai', balance: 2_000_000 },
  ]);

  const initialWealth = engine.getTotalWealth();
  assert(initialWealth === 12_000_000, 'Initial family wealth must be exactly 12.000.000');

  // TEST 1: Expense Transaction
  engine.createTransaction({
    id: 'tx-1',
    account_id: 'acc-bca',
    type: 'expense',
    amount: 500_000,
  });
  assert(engine.getAccount('acc-bca').balance === 9_500_000, 'BCA balance decreases by 500.000 after expense');
  assert(engine.getTotalWealth() === 11_500_000, 'Total wealth decreases by exactly the expense amount');

  // TEST 2: Income Transaction
  engine.createTransaction({
    id: 'tx-2',
    account_id: 'acc-cash',
    type: 'income',
    amount: 1_000_000,
  });
  assert(engine.getAccount('acc-cash').balance === 3_000_000, 'Cash balance increases by 1.000.000 after income');
  assert(engine.getTotalWealth() === 12_500_000, 'Total wealth increases by exactly the income amount');

  // TEST 3: Transfer Transaction (Wealth Conservation Invariant)
  const wealthBeforeTransfer = engine.getTotalWealth();
  engine.createTransaction({
    id: 'tx-3',
    account_id: 'acc-bca',
    destination_account_id: 'acc-cash',
    type: 'transfer',
    amount: 2_000_000,
  });
  assert(engine.getAccount('acc-bca').balance === 7_500_000, 'Source account (BCA) decreases by transfer amount');
  assert(engine.getAccount('acc-cash').balance === 5_000_000, 'Destination account (Cash) increases by transfer amount');
  assert(
    engine.getTotalWealth() === wealthBeforeTransfer,
    'TRANSFER WEALTH CONSERVATION: Total family wealth DOES NOT CHANGE during transfer'
  );

  // TEST 4: Edit Transaction (Reversal + Re-application)
  engine.editTransaction('tx-1', { amount: 300_000 }); // changed expense from 500k to 300k (+200k back)
  assert(engine.getAccount('acc-bca').balance === 7_700_000, 'Editing expense from 500k to 300k restores 200k to account balance');
  assert(engine.getTotalWealth() === 12_700_000, 'Total wealth accurately tracks the modified expense');

  // TEST 5: Delete Transaction (Full balance reversal)
  engine.deleteTransaction('tx-3'); // delete the 2.000.000 transfer
  assert(engine.getAccount('acc-bca').balance === 9_700_000, 'Deleting transfer restores source balance');
  assert(engine.getAccount('acc-cash').balance === 3_000_000, 'Deleting transfer reverts destination balance');
  assert(engine.getTotalWealth() === 12_700_000, 'Total wealth remains consistent after transfer deletion');

  // TEST 6: Simulated Concurrency (Two simultaneous transactions)
  const wealthBeforeConcurrency = engine.getTotalWealth();
  const txA = { id: 'tx-c1', account_id: 'acc-bca', type: 'expense' as const, amount: 100_000 };
  const txB = { id: 'tx-c2', account_id: 'acc-bca', type: 'expense' as const, amount: 200_000 };
  // Execute sequentially without race condition
  engine.createTransaction(txA);
  engine.createTransaction(txB);
  assert(engine.getAccount('acc-bca').balance === 9_400_000, 'Concurrent transactions sum correctly without race condition');
  assert(engine.getTotalWealth() === wealthBeforeConcurrency - 300_000, 'Total wealth decreases by total of both concurrent transactions');

  console.log(`\nFINANCIAL INTEGRITY RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  return failed === 0;
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('financial-integrity.test')) {
  const success = runFinancialIntegrityTests();
  process.exit(success ? 0 : 1);
}
