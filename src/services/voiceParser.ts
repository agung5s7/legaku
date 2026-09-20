import { Account, Category, TransactionType, VoiceParseResult } from '../types';

/**
 * Converts Indonesian spoken number words to numeric values
 * Example: "tiga ratus dua puluh ribu" -> 320000
 */
export function parseIndonesianSpokenNumber(text: string): number {
  const clean = text.toLowerCase().replace(/rp|\.|\,/g, ' ').trim();

  // Direct digits check first
  const digitMatches = clean.match(/(\d+[\d\s]*\d+|\d+)/);
  if (digitMatches) {
    const rawNum = parseInt(digitMatches[0].replace(/\s+/g, ''), 10);
    // Check if followed by "ribu" or "juta"
    if (clean.includes('ribu') && rawNum < 1000) {
      return rawNum * 1000;
    }
    if (clean.includes('juta') && rawNum < 1000) {
      return rawNum * 1000000;
    }
    if (rawNum > 0) return rawNum;
  }

  // Indonesian Slang Numbers
  if (clean.includes('seceng')) return 1000;
  if (clean.includes('noceng')) return 2000;
  if (clean.includes('goceng')) return 5000;
  if (clean.includes('ceban')) return 10000;
  if (clean.includes('goban')) return 50000;
  if (clean.includes('cepek')) return 100000;
  if (clean.includes('gocap')) return 50000;

  const basicWords: { [key: string]: number } = {
    nol: 0,
    satu: 1,
    se: 1,
    dua: 2,
    tiga: 3,
    empat: 4,
    lima: 5,
    enam: 6,
    tujuh: 7,
    delapan: 8,
    sembilan: 9,
    sepuluh: 10,
    sebelas: 11,
  };

  const tokens = clean.split(/\s+/);
  let total = 0;
  let current = 0;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];

    if (basicWords[word] !== undefined) {
      current += basicWords[word];
    } else if (word === 'belas') {
      current += 10;
    } else if (word === 'puluh') {
      current = (current === 0 ? 1 : current) * 10;
    } else if (word === 'ratus' || word === 'seratus') {
      current = (word === 'seratus' || current === 0 ? 1 : current) * 100;
    } else if (word === 'ribu' || word === 'seribu') {
      const multiplier = word === 'seribu' && current === 0 ? 1 : current === 0 ? 1 : current;
      total += multiplier * 1000;
      current = 0;
    } else if (word === 'juta' || word === 'jeti') {
      const multiplier = current === 0 ? 1 : current;
      total += multiplier * 1000000;
      current = 0;
    } else if (word === 'setengah') {
      if (tokens[i + 1] === 'juta') {
        total += 500000;
        i++;
      }
    }
  }

  total += current;
  return total;
}

/**
 * Parses free-form Indonesian voice or text sentence into structured transaction data
 */
export function parseVoiceTransaction(
  transcript: string,
  categories: Category[],
  accounts: Account[]
): VoiceParseResult {
  const lower = transcript.toLowerCase();

  // 1. Determine Type (Expense vs Income)
  const isIncome =
    lower.includes('gaji') ||
    lower.includes('pemasukan') ||
    lower.includes('dapat uang') ||
    lower.includes('transferan masuk') ||
    lower.includes('freelance masuk') ||
    lower.includes('bonus');

  const type: TransactionType = isIncome ? 'income' : 'expense';

  // 2. Extract Amount
  const amount = parseIndonesianSpokenNumber(lower);

  // 3. Extract Category
  let matchedCat: Category | undefined;
  const filteredCats = categories.filter((c) => c.type === type);

  if (lower.includes('makan') || lower.includes('minum') || lower.includes('kopi') || lower.includes('sate') || lower.includes('bakso') || lower.includes('resto')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('makan'));
  } else if (lower.includes('bensin') || lower.includes('tol') || lower.includes('parkir') || lower.includes('ojol') || lower.includes('grab') || lower.includes('gojek') || lower.includes('transport')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('transport'));
  } else if (lower.includes('listrik') || lower.includes('wifi') || lower.includes('pln') || lower.includes('pdam') || lower.includes('tagihan')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('tagihan'));
  } else if (lower.includes('belanja') || lower.includes('supermarket') || lower.includes('minimarket') || lower.includes('indomaret') || lower.includes('alfamart')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('belanja') || c.name.toLowerCase().includes('rumah tangga'));
  } else if (lower.includes('obat') || lower.includes('dokter') || lower.includes('apotek') || lower.includes('sehat')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('kesehatan'));
  } else if (lower.includes('sekolah') || lower.includes('kursus') || lower.includes('buku')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('pendidikan'));
  } else if (lower.includes('nonton') || lower.includes('game') || lower.includes('liburan') || lower.includes('hiburan')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('hiburan'));
  } else if (isIncome && (lower.includes('gaji') || lower.includes('kantor'))) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('gaji'));
  } else if (isIncome && lower.includes('freelance')) {
    matchedCat = filteredCats.find((c) => c.name.toLowerCase().includes('freelance'));
  }

  if (!matchedCat && filteredCats.length > 0) {
    matchedCat = filteredCats[0];
  }

  // 4. Extract Account
  let matchedAccount: Account | undefined;
  for (const acc of accounts) {
    const accName = acc.name.toLowerCase();
    if (lower.includes(accName)) {
      matchedAccount = acc;
      break;
    }
  }
  if (!matchedAccount) {
    if (lower.includes('bca')) matchedAccount = accounts.find((a) => a.name.toLowerCase().includes('bca'));
    else if (lower.includes('mandiri')) matchedAccount = accounts.find((a) => a.name.toLowerCase().includes('mandiri'));
    else if (lower.includes('gopay')) matchedAccount = accounts.find((a) => a.name.toLowerCase().includes('gopay'));
    else if (lower.includes('cash') || lower.includes('tunai') || lower.includes('dompet')) {
      matchedAccount = accounts.find((a) => a.type === 'cash');
    }
  }
  if (!matchedAccount && accounts.length > 0) {
    matchedAccount = accounts[0];
  }

  // 5. Clean Description
  let desc = transcript
    .replace(/^catat(kan)?\s+/i, '')
    .replace(/^tolong\s+catat(kan)?\s+/i, '')
    .replace(/\s+(pakai|dari|lewat)\s+(cash|tunai|bca|gopay|mandiri).*/i, '')
    .trim();

  // Capitalize first letter
  if (desc) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  } else {
    desc = matchedCat ? matchedCat.name : isIncome ? 'Pemasukan' : 'Pengeluaran';
  }

  // 6. Date
  let dateStr = new Date().toISOString().split('T')[0];
  if (lower.includes('kemarin')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    dateStr = d.toISOString().split('T')[0];
  }

  const confidence = amount > 0 ? 0.92 : 0.6;

  return {
    type,
    amount,
    description: desc,
    suggested_category_id: matchedCat?.id,
    suggested_category_name: matchedCat?.name,
    suggested_category_icon: matchedCat?.icon,
    account_id: matchedAccount?.id,
    account_name: matchedAccount?.name,
    date: dateStr,
    confidence,
    raw_transcript: transcript,
  };
}

/**
 * Browser Web Speech API listener helper
 */
export class SpeechListener {
  private recognition: any = null;
  private isListening = false;

  constructor(
    private onResult: (transcript: string) => void,
    private onError: (error: string) => void,
    private onEnd: () => void
  ) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'id-ID';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        this.onError(event.error || 'Kendala mengenali suara');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEnd();
      };
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      }
    }
  }
}
