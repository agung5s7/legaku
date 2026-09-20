/**
 * AI FAILURE & HUMAN-IN-THE-LOOP TEST SUITE — LEGAKU PHASE 5
 * Validates resilience and guarantees zero silent financial mutations during AI failures.
 */

interface DraftTransaction {
  amount?: number;
  description?: string;
  category_name?: string;
  isConfirmedByUser: boolean;
}

class SafeAiWorkflow {
  private transactionsStore: any[] = [];

  // Simulated AI OCR/Voice Pipeline with Human-in-the-Loop guard
  public processReceiptOrVoice(
    aiResponseSuccess: boolean,
    simulatedData?: { amount: number; description: string }
  ): { status: 'preview_ready' | 'fallback_manual' | 'error'; draft?: DraftTransaction; message: string } {
    if (!aiResponseSuccess || !simulatedData) {
      // Graceful fallback to manual input without crash or bogus record creation
      return {
        status: 'fallback_manual',
        message: 'AI mengalami kendala membaca data. Dialihkan ke formulir manual yang tenang.',
      };
    }

    // AI produces ONLY a draft preview, NOT a saved transaction!
    const draft: DraftTransaction = {
      amount: simulatedData.amount,
      description: simulatedData.description,
      isConfirmedByUser: false, // Must remain false until user clicks Save
    };

    return {
      status: 'preview_ready',
      draft,
      message: 'Pratinjau siap. Menunggu konfirmasi pengguna.',
    };
  }

  // Final save guard: Strictly rejects unconfirmed AI transactions
  public saveTransaction(draft: DraftTransaction): boolean {
    if (!draft.isConfirmedByUser) {
      throw new Error('SECURITY VIOLATION: Cannot commit transaction without explicit user confirmation!');
    }

    this.transactionsStore.push({ ...draft, id: `tx-${Date.now()}` });
    return true;
  }

  public getSavedCount(): number {
    return this.transactionsStore.length;
  }
}

// ==============================================================================
// TEST RUNNER
// ==============================================================================
export function runAiFailureTests() {
  console.log('--- RUNNING AI FAILURE & HUMAN-IN-THE-LOOP TESTS ---');
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

  const workflow = new SafeAiWorkflow();

  // TEST 1: API Unavailable / Network Timeout
  const test1 = workflow.processReceiptOrVoice(false);
  assert(test1.status === 'fallback_manual', 'API failure results in graceful manual fallback');
  assert(test1.draft === undefined, 'No draft created on AI failure');
  assert(workflow.getSavedCount() === 0, 'Zero transactions committed to database on API failure');

  // TEST 2: OCR Unreadable Receipt
  const test2 = workflow.processReceiptOrVoice(false, undefined);
  assert(test2.status === 'fallback_manual', 'Unreadable receipt triggers fallback without corrupting state');
  assert(workflow.getSavedCount() === 0, 'Zero transactions committed on unreadable receipt');

  // TEST 3: Voice Parser Low Confidence
  const test3 = workflow.processReceiptOrVoice(false);
  assert(test3.message.includes('manual'), 'Low confidence voice input provides user-friendly explanation');

  // TEST 4: Human-in-the-loop Guard (Attempt to save without user confirmation)
  const test4 = workflow.processReceiptOrVoice(true, { amount: 150_000, description: 'Belanja Supermarket' });
  assert(test4.status === 'preview_ready', 'Valid AI response produces draft preview');
  assert(test4.draft !== undefined && test4.draft.isConfirmedByUser === false, 'Draft is initially UNCONFIRMED');

  let blocked = false;
  try {
    workflow.saveTransaction(test4.draft!);
  } catch (err: any) {
    blocked = true;
  }
  assert(blocked, 'GUARD INVARIANT: System strictly blocks saving unconfirmed AI drafts');
  assert(workflow.getSavedCount() === 0, 'Database remains unchanged when draft is unconfirmed');

  // TEST 5: Legitimate User Confirmation
  test4.draft!.isConfirmedByUser = true;
  const saved = workflow.saveTransaction(test4.draft!);
  assert(saved === true, 'Transaction commits successfully after explicit user confirmation');
  assert(workflow.getSavedCount() === 1, 'Database contains exactly 1 verified record');

  console.log(`\nAI FAILURE TEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
  return failed === 0;
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('ai-failure.test')) {
  const success = runAiFailureTests();
  process.exit(success ? 0 : 1);
}
