import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Wallet, Landmark, Smartphone, CreditCard, Plus, Check } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { accounts, addAccount, totalBalance } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setIsModalOpen(false);
      setName('');
      setType('bank');
      setInitialBalanceInput('');
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header & Balance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-950">Daftar Rekening & Dompet</h2>
          <p className="text-xs text-warm-muted mt-0.5">
            Total saldo gabungan: <strong className="text-forest-900">{formatRupiah(totalBalance)}</strong>
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun
        </Button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white border border-warm-border/70 rounded-3xl p-4.5 shadow-soft hover:shadow-card transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sage-100/90 flex items-center justify-center shrink-0">
                {getAccountIcon(acc.type)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-warm-dark">{acc.name}</h3>
                <span className="text-[10px] text-warm-muted uppercase tracking-wider font-semibold">
                  {acc.type}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-base font-bold text-forest-950">{formatRupiah(acc.current_balance)}</p>
              <p className="text-[10px] text-warm-muted mt-0.5">Saldo aktif</p>
            </div>
          </div>
        ))}
      </div>

      {/* ADD ACCOUNT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
    </div>
  );
};
