import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { formatRupiah, parseRupiahInput, formatIndoDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  History,
  CheckCircle2,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, totalBalance, transactions, transfers } = useFinance();

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manage / Edit / Delete Modal State
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AccountType>('bank');
  const [editInitialBalanceInput, setEditInitialBalanceInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [manageError, setManageError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'bank':
        return <Landmark className="w-5 h-5 text-forest-700" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-forest-700" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-forest-700" />;
      case 'cash':
      default:
        return <Wallet className="w-5 h-5 text-forest-700" />;
    }
  };

  const getAccountTypeLabel = (accType: AccountType) => {
    switch (accType) {
      case 'bank':
        return 'Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'credit_card':
        return 'Kartu Kredit';
      case 'cash':
      default:
        return 'Tunai';
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama rekening/dompet harus diisi.');
      return;
    }

    const initBal = parseRupiahInput(initialBalanceInput);

    setIsSubmitting(true);
    const res = await addAccount({
      family_id: '',
      name: name.trim(),
      type,
      initial_balance: initBal,
      current_balance: initBal,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsAddModalOpen(false);
      setName('');
      setType('bank');
      setInitialBalanceInput('');
    }
  };

  const handleOpenManage = (acc: Account) => {
    setSelectedAccount(acc);
    setIsEditMode(false);
    setEditName(acc.name);
    setEditType(acc.type);
    setEditInitialBalanceInput(formatRupiah(acc.initial_balance || 0));
    setDeleteConfirm(false);
    setManageError('');
    setSuccessMsg('');
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setManageError('');

    if (!editName.trim()) {
      setManageError('Nama rekening/dompet harus diisi.');
      return;
    }

    const newInitBal = parseRupiahInput(editInitialBalanceInput);

    setIsSubmitting(true);
    const res = await updateAccount(selectedAccount.id, {
      name: editName.trim(),
      type: editType,
      initial_balance: newInitBal,
    });
    setIsSubmitting(false);

    if (res.error) {
      setManageError(res.error);
    } else {
      setSuccessMsg('Rekening berhasil diperbarui!');
      setIsEditMode(false);
      // Update local preview
      setSelectedAccount({
        ...selectedAccount,
        name: editName.trim(),
        type: editType,
        initial_balance: newInitBal,
      });
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setManageError('');
    setIsDeleting(true);

    const res = await deleteAccount(selectedAccount.id);
    setIsDeleting(false);

    if (res.error) {
      setManageError(res.error);
      setDeleteConfirm(false);
    } else {
      setSelectedAccount(null);
      setDeleteConfirm(false);
    }
  };

  // Calculate related transactions for selected account
  const relatedTransactions = selectedAccount
    ? transactions.filter((t) => t.account_id === selectedAccount.id)
    : [];
  const relatedTransfers = selectedAccount
    ? transfers.filter((tr) => tr.from_account_id === selectedAccount.id || tr.to_account_id === selectedAccount.id)
    : [];
  const totalAccountActivityCount = relatedTransactions.length + relatedTransfers.length;

  return (
    <div className="space-y-5 pb-6">
      {/* Header & Balance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-950">Daftar Rekening & Dompet</h2>
          <p className="text-xs text-warm-muted mt-0.5">
            Total saldo gabungan: <strong className="text-forest-900 font-bold">{formatRupiah(totalBalance)}</strong>
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun
        </Button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {accounts.map((acc) => {
          const accTxCount = transactions.filter((t) => t.account_id === acc.id).length;
          return (
            <div
              key={acc.id}
              onClick={() => handleOpenManage(acc)}
              className="bg-white border border-warm-border/70 rounded-3xl p-4.5 shadow-soft hover:shadow-card hover:border-forest-400/80 transition-all flex items-center justify-between cursor-pointer group"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sage-100/90 group-hover:bg-sage-200/90 transition-colors flex items-center justify-center shrink-0">
                  {getAccountIcon(acc.type)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-warm-dark group-hover:text-forest-900 transition-colors">
                      {acc.name}
                    </h3>
                    <Edit2 className="w-3 h-3 text-warm-stone/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-warm-muted uppercase tracking-wider font-semibold">
                      {getAccountTypeLabel(acc.type)}
                    </span>
                    {accTxCount > 0 && (
                      <span className="text-[10px] text-forest-700 bg-forest-50 px-1.5 py-0.2 rounded font-medium">
                        {accTxCount} transaksi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-bold text-forest-950">{formatRupiah(acc.current_balance)}</p>
                <p className="text-[10px] text-warm-muted mt-0.5">Saldo aktif</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD ACCOUNT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Rekening / Dompet"
        subtitle="Daftarkan akun keuangan keluarga Anda."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label="Nama Akun"
            placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-forest-900/80 tracking-wide uppercase">
              Jenis Akun
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'bank', label: 'Bank', icon: Landmark },
                { id: 'ewallet', label: 'E-Wallet', icon: Smartphone },
                { id: 'cash', label: 'Tunai', icon: Wallet },
                { id: 'credit_card', label: 'Kartu Kredit', icon: CreditCard },
              ].map((item) => {
                const isSelected = type === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as AccountType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-sage-100 border-forest-600 text-forest-900 shadow-sm'
                        : 'bg-white border-warm-border text-warm-dark hover:bg-cream-50'
                    }`}
                  >
                    <IconComp className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Saldo Awal (Rp)"
            placeholder="Rp 0"
            value={initialBalanceInput}
            onChange={(e) => setInitialBalanceInput(formatRupiah(parseRupiahInput(e.target.value)))}
          />

          {errorMsg && <p className="text-xs text-earth-rust">{errorMsg}</p>}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full h-12"
            >
              Simpan Akun
            </Button>
          </div>
        </form>
      </Modal>

      {/* MANAGE / DETAIL / EDIT / DELETE MODAL */}
      {selectedAccount && (
        <Modal
          isOpen={!!selectedAccount}
          onClose={() => {
            setSelectedAccount(null);
            setIsEditMode(false);
            setDeleteConfirm(false);
          }}
          title={isEditMode ? 'Ubah Rekening / Dompet' : 'Rincian Akun Keuangan'}
          subtitle={
            isEditMode
              ? 'Perbarui data akun keuangan keluarga.'
              : 'Informasi saldo aktif dan riwayat pencatatan akun ini.'
          }
        >
          <div className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-forest-50 border border-forest-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-forest-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-forest-600" />
                {successMsg}
              </div>
            )}

            {manageError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs font-medium text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                {manageError}
              </div>
            )}

            {!isEditMode ? (
              // VIEW DETAIL MODE
              <div className="space-y-4">
                {/* Account Balance Summary Card */}
                <div className="p-4 bg-cream-50/80 border border-warm-border/70 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center shrink-0">
                      {getAccountIcon(selectedAccount.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-warm-dark">{selectedAccount.name}</h4>
                      <p className="text-xs text-warm-muted uppercase tracking-wider font-semibold">
                        {getAccountTypeLabel(selectedAccount.type)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-warm-muted uppercase font-bold">Saldo Aktif</span>
                    <p className="text-lg font-bold text-forest-900">{formatRupiah(selectedAccount.current_balance)}</p>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-warm-border/40">
                    <span className="text-warm-muted">Saldo Awal Terdaftar</span>
                    <span className="font-semibold text-warm-dark">
                      {formatRupiah(selectedAccount.initial_balance || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-warm-border/40">
                    <span className="text-warm-muted">Aktivitas Tercatat</span>
                    <span className="font-semibold text-warm-dark">
                      {totalAccountActivityCount > 0
                        ? `${totalAccountActivityCount} Riwayat (${relatedTransactions.length} Transaksi, ${relatedTransfers.length} Transfer)`
                        : 'Belum ada transaksi'}
                    </span>
                  </div>
                </div>

                {/* Recent Transactions List on this account */}
                {relatedTransactions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-forest-950">
                      <History className="w-3.5 h-3.5 text-forest-700" />
                      Riwayat Terakhir di Rekening Ini
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {relatedTransactions.slice(0, 4).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-warm-border/50 rounded-xl text-xs"
                        >
                          <div>
                            <p className="font-semibold text-warm-dark">{tx.description}</p>
                            <p className="text-[10px] text-warm-muted">{formatIndoDate(tx.transaction_date)}</p>
                          </div>
                          <span
                            className={`font-bold ${
                              tx.type === 'income' ? 'text-forest-700' : 'text-earth-rust'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditMode(true)}
                      className="gap-1.5 h-11"
                    >
                      <Edit2 className="w-4 h-4" />
                      Ubah Rekening
                    </Button>

                    {!deleteConfirm ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          if (totalAccountActivityCount > 0) {
                            setManageError(
                              `Rekening ini memiliki ${totalAccountActivityCount} riwayat transaksi aktif. Hapus atau ubah transaksi tersebut terlebih dahulu sebelum menghapus rekening.`
                            );
                          } else {
                            setDeleteConfirm(true);
                          }
                        }}
                        className="text-earth-rust hover:bg-red-50 hover:text-red-700 gap-1.5 h-11"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus Akun
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="danger"
                        isLoading={isDeleting}
                        onClick={handleDeleteAccount}
                        className="gap-1.5 h-11"
                      >
                        Yakin Hapus?
                      </Button>
                    )}
                  </div>

                  {deleteConfirm && (
                    <p className="text-center text-[11px] text-earth-rust font-medium animate-fadeIn">
                      Akun ini belum memiliki transaksi. Klik tombol merah di atas untuk konfirmasi penghapusan.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // EDIT FORM MODE
              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <Input
                  label="Nama Akun"
                  placeholder="Contoh: BCA Agung, Dompet Tunai"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-forest-900/80 tracking-wide uppercase">
                    Jenis Akun
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bank', label: 'Bank', icon: Landmark },
                      { id: 'ewallet', label: 'E-Wallet', icon: Smartphone },
                      { id: 'cash', label: 'Tunai', icon: Wallet },
                      { id: 'credit_card', label: 'Kartu Kredit', icon: CreditCard },
                    ].map((item) => {
                      const isSelected = editType === item.id;
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setEditType(item.id as AccountType)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'bg-sage-100 border-forest-600 text-forest-900 shadow-sm'
                              : 'bg-white border-warm-border text-warm-dark hover:bg-cream-50'
                          }`}
                        >
                          <IconComp className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Input
                    label="Saldo Awal Pendaftaran (Rp)"
                    placeholder="Rp 0"
                    value={editInitialBalanceInput}
                    onChange={(e) =>
                      setEditInitialBalanceInput(formatRupiah(parseRupiahInput(e.target.value)))
                    }
                  />
                  <p className="text-[11px] text-warm-muted mt-1">
                    Mengubah saldo awal akan secara otomatis memperbarui saldo aktif saat ini.
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    className="h-11"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="h-11"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
