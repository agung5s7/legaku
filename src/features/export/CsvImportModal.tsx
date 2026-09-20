import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { CsvColumnMapping, CsvRowValidation, TransactionType } from '../../types';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories, accounts, transactions, addTransaction } = useFinance();
  const { profile } = useAuth();

  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'importing'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [mapping, setMapping] = useState<CsvColumnMapping>({
    date: '',
    description: '',
    amount: '',
    type: '',
    category: '',
    account: '',
  });

  const [defaultAccountId, setDefaultAccountId] = useState<string>('');
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [importProgress, setImportProgress] = useState<number>(0);

  // Initialize defaults
  React.useEffect(() => {
    if (accounts.length > 0 && !defaultAccountId) setDefaultAccountId(accounts[0].id);
    if (categories.length > 0 && !defaultCategoryId) setDefaultCategoryId(categories[0].id);
  }, [accounts, categories, defaultAccountId, defaultCategoryId]);

  // Parse CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    // MIME and size check
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMsg('Harap pilih berkas dengan format .csv');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran berkas maksimal 5 MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setErrorMsg('Berkas CSV kosong');
        return;
      }

      // Simple CSV Parser handling commas and semicolons
      const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('Berkas CSV harus memiliki minimal header dan 1 baris data');
        return;
      }

      // Detect delimiter (, or ;)
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
      setCsvHeaders(headers);

      const parsedRows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = parts[idx] || '';
        });
        parsedRows.push(rowObj);
      }
      setRawRows(parsedRows);

      // Smart Header Auto-Detection
      const lowerHeaders = headers.map((h) => h.toLowerCase());
      const findMatch = (keys: string[]) => {
        const idx = lowerHeaders.findIndex((h) => keys.some((k) => h.includes(k)));
        return idx !== -1 ? headers[idx] : '';
      };

      setMapping({
        date: findMatch(['tanggal', 'date', 'tgl', 'waktu']),
        description: findMatch(['keterangan', 'deskripsi', 'description', 'rincian', 'nama', 'item']),
        amount: findMatch(['nominal', 'jumlah', 'amount', 'total', 'harga', 'biaya', 'debit', 'kredit']),
        type: findMatch(['tipe', 'type', 'jenis', 'arus']),
        category: findMatch(['kategori', 'category', 'pos']),
        account: findMatch(['rekening', 'akun', 'account', 'bank', 'dompet']),
      });

      setStep('mapping');
    };
    reader.readAsText(file);
  };

  // Perform Row Validation & Duplicate Detection
  const validatedRows: CsvRowValidation[] = React.useMemo(() => {
    if (step !== 'validation') return [];

    return rawRows.map((row, idx) => {
      const errors: string[] = [];
      const rawDate = row[mapping.date] || '';
      const rawDesc = row[mapping.description] || '';
      const rawAmount = row[mapping.amount] || '';

      if (!rawDate) errors.push('Tanggal kosong');
      if (!rawDesc) errors.push('Keterangan kosong');
      if (!rawAmount) errors.push('Nominal kosong');

      // Amount parsing
      const cleanNum = parseRupiahInput(rawAmount);
      if (cleanNum <= 0) errors.push('Nominal tidak valid');

      // Date parsing into YYYY-MM-DD
      let parsedDate = '';
      try {
        if (rawDate.includes('-')) {
          const parts = rawDate.split('-');
          if (parts[0].length === 4) parsedDate = rawDate; // YYYY-MM-DD
          else parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts[2].length === 4) parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else {
          parsedDate = new Date(rawDate).toISOString().split('T')[0];
        }
      } catch {
        errors.push('Format tanggal tidak dikenali');
      }

      // Check category match
      const catVal = mapping.category ? row[mapping.category]?.toLowerCase() : '';
      const matchedCat = categories.find((c) => c.name.toLowerCase().includes(catVal))?.id || defaultCategoryId;

      // Check account match
      const accVal = mapping.account ? row[mapping.account]?.toLowerCase() : '';
      const matchedAcc = accounts.find((a) => a.name.toLowerCase().includes(accVal))?.id || defaultAccountId;

      // Check type
      const typeVal = mapping.type ? row[mapping.type]?.toLowerCase() : '';
      const parsedType: TransactionType = typeVal.includes('masuk') || typeVal.includes('income') ? 'income' : 'expense';

      // Check duplicate
      const isDup = transactions.some(
        (tx) =>
          tx.transaction_date === parsedDate &&
          Math.abs(Number(tx.amount) - cleanNum) < 1 &&
          tx.description.toLowerCase() === rawDesc.toLowerCase()
      );

      return {
        rowIndex: idx + 1,
        raw: row,
        isValid: errors.length === 0,
        errors,
        isDuplicate: isDup,
        parsed:
          errors.length === 0
            ? {
                date: parsedDate,
                description: rawDesc,
                amount: cleanNum,
                type: parsedType,
                category_id: matchedCat,
                account_id: matchedAcc,
              }
            : undefined,
      };
    });
  }, [step, rawRows, mapping, categories, accounts, defaultCategoryId, defaultAccountId, transactions]);

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const invalidCount = validatedRows.filter((r) => !r.isValid).length;
  const duplicateCount = validatedRows.filter((r) => r.isDuplicate).length;

  // Execute Batch Import
  const handleConfirmImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const rowsToImport = validatedRows.filter((r) => {
      if (!r.isValid || !r.parsed) return false;
      if (skipDuplicates && r.isDuplicate) return false;
      return true;
    });

    let successCount = 0;
    for (let i = 0; i < rowsToImport.length; i++) {
      const item = rowsToImport[i].parsed!;
      await addTransaction({
        family_id: '',
        account_id: item.account_id,
        category_id: item.category_id,
        type: item.type,
        amount: item.amount,
        transaction_date: item.date,
        description: item.description,
        source: 'import',
        creator_name: profile?.full_name,
      });
      successCount++;
      setImportProgress(Math.round(((i + 1) / rowsToImport.length) * 100));
    }

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#467B60', '#8FB09A', '#C49744'],
    });

    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Catatan Transaksi (CSV)"
      subtitle="Pindahkan riwayat pengeluaran masa lalu ke LEGAKU dengan mudah dan aman."
    >
      <div className="space-y-4">
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-warm-border hover:border-forest-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-cream-50/40 hover:bg-sage-50/40">
              <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mb-3 shadow-soft">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-forest-950 block">
                Pilih Berkas CSV dari Perangkat
              </span>
              <span className="text-xs text-warm-muted mt-1 max-w-xs block">
                Mendukung ekspor dari spreadsheet Excel, Google Sheets, atau aplikasi perbankan.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {errorMsg && (
              <div className="p-3 bg-earth-terracotta/10 border border-earth-terracotta/20 text-earth-rust text-xs rounded-2xl">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-3.5">
            <div className="p-3 bg-sage-50 border border-sage-200 rounded-2xl flex items-center gap-2.5 text-xs text-forest-900">
              <FileSpreadsheet className="w-4 h-4 text-forest-800 shrink-0" />
              <span className="font-semibold truncate">{fileName} ({rawRows.length} baris)</span>
            </div>

            <p className="text-xs text-warm-muted">
              Cocokkan kolom tabel pada berkas Anda dengan data yang dibutuhkan LEGAKU:
            </p>

            <div className="space-y-2.5 bg-white border border-warm-border rounded-2xl p-4 shadow-soft text-xs">
              {/* Tanggal */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-warm-dark w-1/3">Tanggal *</span>
                <select
                  value={mapping.date}
                  onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                  className="w-2/3 bg-cream-50 border border-warm-border rounded-xl p-2 font-medium"
                >
                  <option value="">-- Pilih Kolom --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keterangan */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-warm-dark w-1/3">Keterangan *</span>
                <select
                  value={mapping.description}
                  onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                  className="w-2/3 bg-cream-50 border border-warm-border rounded-xl p-2 font-medium"
                >
                  <option value="">-- Pilih Kolom --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-warm-dark w-1/3">Nominal *</span>
                <select
                  value={mapping.amount}
                  onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                  className="w-2/3 bg-cream-50 border border-warm-border rounded-xl p-2 font-medium"
                >
                  <option value="">-- Pilih Kolom --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipe */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-warm-muted w-1/3">Tipe (Opsional)</span>
                <select
                  value={mapping.type}
                  onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                  className="w-2/3 bg-cream-50 border border-warm-border rounded-xl p-2 font-medium"
                >
                  <option value="">-- Default Pengeluaran --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rekening Default */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-warm-border/40">
                <span className="font-semibold text-warm-dark w-1/3">Rekening Masuk</span>
                <select
                  value={defaultAccountId}
                  onChange={(e) => setDefaultAccountId(e.target.value)}
                  className="w-2/3 bg-cream-50 border border-warm-border rounded-xl p-2 font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('upload')} className="flex-1 text-xs">
                Kembali
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!mapping.date || !mapping.description || !mapping.amount}
                onClick={() => setStep('validation')}
                className="flex-1 text-xs"
              >
                Lanjut Validasi
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: VALIDATION SUMMARY */}
        {step === 'validation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-cream-50 border border-warm-border rounded-2xl p-3">
                <span className="text-[10px] text-warm-muted block uppercase">Total Baris</span>
                <span className="text-base font-extrabold text-forest-950 mt-0.5 block">
                  {validatedRows.length}
                </span>
              </div>
              <div className="bg-sage-50 border border-sage-200 rounded-2xl p-3">
                <span className="text-[10px] text-forest-800 block uppercase">Siap Import</span>
                <span className="text-base font-extrabold text-forest-800 mt-0.5 block">
                  {validCount}
                </span>
              </div>
              <div className="bg-earth-terracotta/10 border border-earth-terracotta/20 rounded-2xl p-3">
                <span className="text-[10px] text-earth-rust block uppercase">Perlu Tinjauan</span>
                <span className="text-base font-extrabold text-earth-rust mt-0.5 block">
                  {invalidCount}
                </span>
              </div>
            </div>

            {/* Duplicate Notice */}
            {duplicateCount > 0 && (
              <div className="p-3.5 bg-earth-gold/15 border border-earth-gold/30 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#8C6618]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{duplicateCount} Transaksi Mungkin Sudah Pernah Dicatat</span>
                </div>
                <p className="text-[11px] text-[#745311] leading-relaxed">
                  Ditemukan transaksi dengan tanggal, nominal, dan keterangan yang sama persis di riwayat Anda.
                </p>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-xs pt-1 text-forest-950">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-forest-800 focus:ring-forest-600"
                  />
                  <span>Lewati transaksi duplikat (direkomendasikan)</span>
                </label>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('mapping')} className="flex-1 text-xs">
                Ubah Mapping
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={validCount === 0}
                onClick={handleConfirmImport}
                className="flex-1 text-xs"
              >
                Import Sekarang ({skipDuplicates ? validCount - duplicateCount : validCount})
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORTING PROGRESS */}
        {step === 'importing' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-sage-100 text-forest-800 flex items-center justify-center mx-auto animate-pulse">
              <RotateCcw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-forest-950">Memproses Data Transaksi...</h4>
              <p className="text-xs text-warm-muted mt-1">
                Menyimpan transaksi ke pembukuan keluarga dengan aman ({importProgress}%)
              </p>
            </div>
            <div className="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-forest-800 h-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
