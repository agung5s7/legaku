import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, Transfer } from '../../types';
import { formatRupiah, getRelativeDateTitle } from '../../utils/formatters';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { TransactionDetailModal } from './TransactionDetailModal';
import { TransferDetailModal } from '../transfers/TransferDetailModal';
import { Search, Calendar, ArrowRightLeft, ArrowRight } from 'lucide-react';

type FeedItem =
  | { itemType: 'transaction'; data: Transaction; date: string }
  | { itemType: 'transfer'; data: Transfer; date: string };

export const TransactionsView: React.FC = () => {
  const { transactions, transfers, categories, accounts } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  // Combined and filtered feed items
  const filteredFeed = useMemo(() => {
    const list: FeedItem[] = [];

    // Transactions
    if (selectedType !== 'transfer') {
      for (const tx of transactions) {
        if (selectedType !== 'all' && tx.type !== selectedType) continue;
        if (selectedCategoryId !== 'all' && tx.category_id !== selectedCategoryId) continue;
        if (selectedAccountId !== 'all' && tx.account_id !== selectedAccountId) continue;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesDesc = tx.description.toLowerCase().includes(query);
          const matchesCat = tx.category_name?.toLowerCase().includes(query);
          const matchesAcc = tx.account_name?.toLowerCase().includes(query);
          const matchesNotes = tx.notes?.toLowerCase().includes(query);
          if (!matchesDesc && !matchesCat && !matchesAcc && !matchesNotes) continue;
        }

        list.push({ itemType: 'transaction', data: tx, date: tx.transaction_date });
      }
    }

    // Transfers
    if (selectedType === 'all' || selectedType === 'transfer') {
      for (const trf of transfers) {
        if (selectedCategoryId !== 'all') continue; // transfers don't belong to categories
        if (
          selectedAccountId !== 'all' &&
          trf.from_account_id !== selectedAccountId &&
          trf.to_account_id !== selectedAccountId
        ) {
          continue;
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesDesc = trf.description?.toLowerCase().includes(query);
          const matchesFrom = trf.from_account_name?.toLowerCase().includes(query);
          const matchesTo = trf.to_account_name?.toLowerCase().includes(query);
          if (!matchesDesc && !matchesFrom && !matchesTo) continue;
        }

        list.push({ itemType: 'transfer', data: trf, date: trf.transfer_date });
      }
    }

    return list;
  }, [transactions, transfers, selectedType, selectedCategoryId, selectedAccountId, searchQuery]);

  // Group by date
  const groupedFeed = useMemo(() => {
    const groups: { [dateStr: string]: FeedItem[] } = {};
    for (const item of filteredFeed) {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    }
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sortedDates.map((date) => ({
      date,
      title: getRelativeDateTitle(date),
      items: groups[date],
    }));
  }, [filteredFeed]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-[#6B7280] pointer-events-none" />
          <input
            type="text"
            placeholder="Cari transaksi, transfer, toko, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-[#6B7280] hover:text-[#144D3A]"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {/* Type selector */}
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
              selectedType === 'all'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'bg-[#E8F2EC] text-[#144D3A] hover:bg-[#E8F2EC]/80'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
              selectedType === 'expense'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'bg-[#E8F2EC] text-[#144D3A] hover:bg-[#E8F2EC]/80'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
              selectedType === 'income'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'bg-[#E8F2EC] text-[#144D3A] hover:bg-[#E8F2EC]/80'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setSelectedType('transfer')}
            className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
              selectedType === 'transfer'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'bg-[#E8F2EC] text-[#144D3A] hover:bg-[#E8F2EC]/80'
            }`}
          >
            Transfer
          </button>

          {/* Account Filter Dropdown */}
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-[#E8F2EC] text-[#144D3A] border-0 rounded-full px-3 py-1.5 text-xs font-medium outline-none cursor-pointer hover:bg-[#E8F2EC]/80"
          >
            <option value="all">Semua Akun</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Category Filter Dropdown */}
          {selectedType !== 'transfer' && (
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-[#E8F2EC] text-[#144D3A] border-0 rounded-full px-3 py-1.5 text-xs font-medium outline-none cursor-pointer hover:bg-[#E8F2EC]/80"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Feed List Grouped by Date */}
      {groupedFeed.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-center shadow-sm">
          <Calendar className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#1F2937]">Belum Ada Catatan</h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-xs mx-auto">
            Tidak ada transaksi atau transfer yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedFeed.map((group) => (
            <div key={group.date} className="space-y-2">
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-2">
                {group.title}
              </h3>
              <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
                {group.items.map((item) => {
                  if (item.itemType === 'transaction') {
                    const tx = item.data;
                    const isExp = tx.type === 'expense';
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              isExp ? 'bg-[#E8F2EC] text-[#144D3A]' : 'bg-[#E8F2EC] text-[#22C55E]'
                            }`}
                          >
                            <CategoryIcon name={tx.category_icon} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1F2937] truncate leading-tight">
                              {tx.description}
                            </p>
                            <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1.5 leading-none">
                              <span>{tx.category_name}</span>
                              <span className="text-[#E5E7EB]">•</span>
                              <span>{tx.account_name}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <span
                            className={`text-sm font-bold flex items-center justify-end gap-0.5 ${
                              isExp ? 'text-[#1F2937]' : 'text-[#22C55E]'
                            }`}
                          >
                            {isExp ? '-' : '+'}
                            {formatRupiah(tx.amount)}
                          </span>
                          {tx.creator_name && (
                            <span className="text-[10px] text-[#6B7280] block mt-0.5">
                              {tx.creator_name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Transfer Item
                    const trf = item.data;
                    return (
                      <div
                        key={trf.id}
                        onClick={() => setSelectedTransfer(trf)}
                        className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 cursor-pointer transition-colors bg-[#F9FAF7]/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shrink-0">
                            <ArrowRightLeft className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1F2937] truncate leading-tight flex items-center gap-1.5">
                              <span>{trf.from_account_name || 'Rekening Asal'}</span>
                              <ArrowRight className="w-3 h-3 text-[#6B7280] shrink-0" />
                              <span>{trf.to_account_name || 'Rekening Tujuan'}</span>
                            </p>
                            <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1.5 leading-none">
                              <span className="bg-[#E8F2EC] text-[#144D3A] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Transfer
                              </span>
                              {trf.description && (
                                <>
                                  <span className="text-[#E5E7EB]">•</span>
                                  <span className="truncate">{trf.description}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <span className="text-sm font-bold text-[#144D3A] flex items-center justify-end">
                            {formatRupiah(trf.amount)}
                          </span>
                          {trf.creator_name && (
                            <span className="text-[10px] text-[#6B7280] block mt-0.5">
                              {trf.creator_name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        transfer={selectedTransfer}
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
      />
    </div>
  );
};
