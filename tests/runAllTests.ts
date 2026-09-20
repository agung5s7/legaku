import { runFinancialIntegrityTests } from './financial-integrity.test';
import { runAiFailureTests } from './ai-failure.test';

console.log('========================================================');
console.log('   LEGAKU PHASE 5 PRODUCTION HARDENING TEST SUITE       ');
console.log('========================================================\n');

const finOk = runFinancialIntegrityTests();
const aiOk = runAiFailureTests();

if (finOk && aiOk) {
  console.log('========================================================');
  console.log('🎉 ALL PRODUCTION HARDENING TESTS PASSED SUCCESSFULLY!  ');
  console.log('========================================================\n');
  process.exit(0);
} else {
  console.error('💥 TEST SUITE FAILED WITH ERRORS.');
  process.exit(1);
}
