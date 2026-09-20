import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useFinance } from '../../context/FinanceContext';
import { Bell, ShieldCheck, PieChart, Target, Repeat, TrendingDown, Users } from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notificationPreferences, updateNotificationPreferences } = useFinance();
  const [prefs, setPrefs] = useState(notificationPreferences);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPrefs(notificationPreferences);
      setIsSaved(false);
    }
  }, [isOpen, notificationPreferences]);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    await updateNotificationPreferences(prefs);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const settingsList = [
    {
      key: 'recurring_reminders' as const,
      title: 'Pengingat Tagihan & Pemasukan Rutin',
      desc: 'Mengingatkan tagihan yang akan jatuh tempo (seperti internet, listrik, cicilan)',
      icon: <Repeat className="w-4 h-4 text-forest-800" />,
    },
    {
      key: 'budget_alerts' as const,
      title: 'Peringatan Pos Anggaran (≥80% & >100%)',
      desc: 'Memberitahu secara tenang jika pos pengeluaran mendekati atau melampaui batas anggaran',
      icon: <PieChart className="w-4 h-4 text-earth-rust" />,
    },
    {
      key: 'goal_milestones' as const,
      title: 'Tonggak Capaian Target Impian (25%, 50%, 75%, 100%)',
      desc: 'Apresiasi bersama saat tabungan target keluarga mencapai milestone penting',
      icon: <Target className="w-4 h-4 text-earth-gold" />,
    },
    {
      key: 'unusual_alerts' as const,
      title: 'Deteksi Transaksi Unik / Lebih Besar',
      desc: 'Memberi tahu jika ada nominal transaksi yang jauh lebih tinggi dari rata-rata pos biasanya',
      icon: <TrendingDown className="w-4 h-4 text-sage-700" />,
    },
    {
      key: 'family_activity' as const,
      title: 'Pemberitahuan Aktivitas Pasangan',
      desc: 'Pemberitahuan saat pasangan mencatat transaksi atau menambah target bersama (default tenang: mati)',
      icon: <Users className="w-4 h-4 text-forest-900" />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan Notifikasi"
      subtitle="Pilih informasi yang penting bagi Anda. LEGAKU memegang prinsip non-intrusif dan damai."
    >
      <div className="space-y-4">
        <div className="space-y-2.5">
          {settingsList.map((item) => {
            const isChecked = prefs[item.key];
            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className="p-3.5 bg-white border border-warm-border/70 rounded-2xl flex items-start gap-3 cursor-pointer hover:bg-sage-50/40 transition-colors shadow-soft"
              >
                <div className="w-8 h-8 rounded-xl bg-cream-100 flex items-center justify-center shrink-0 mt-0.5">
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-forest-950 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-warm-muted mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Toggle Switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-1 cursor-pointer ${
                    isChecked ? 'bg-forest-800' : 'bg-warm-border/80'
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                      isChecked ? 'left-6' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="flex-1 text-xs"
          >
            {isSaved ? 'Tersimpan ✓' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
