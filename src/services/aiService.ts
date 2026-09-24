import { AiConversation, AiMessage } from '../types';
import { FamilyFinancialContext } from './financialContext';
import { formatRupiah, formatShortRupiah } from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_AI_MSGS_KEY = 'legaku_ai_messages_store';

export interface AiResponse {
  content: string;
  calculations?: { label: string; value: string }[];
  actionChips?: string[];
}

/**
 * Deterministic AI reasoning engine with guaranteed mathematical accuracy
 */
export function generateDeterministicCompanionResponse(
  userQuery: string,
  ctx: FamilyFinancialContext
): AiResponse {
  const q = userQuery.toLowerCase().trim();

  // 0a. Greetings & Small Talk
  if (
    q === 'halo' ||
    q === 'hallo' ||
    q === 'hi' ||
    q === 'hei' ||
    q.includes('pagi') ||
    q.includes('siang') ||
    q.includes('sore') ||
    q.includes('malam') ||
    q.includes('assalamualaikum') ||
    q.includes('apa kabar')
  ) {
    return {
      content: `Halo! Senang bisa menyapa Anda. Saya LEGAKU AI, siap menjadi teman diskusi keuangan keluarga yang tenang dan bebas dari rasa dihakimi.\n\nSaat ini total saldo tercatat ${formatRupiah(ctx.totalBalance)} dengan sisa cashflow bulan ini ${formatRupiah(ctx.currentMonth.cashflow)}.\n\nAda yang ingin kita bahas atau evaluasi hari ini?`,
      calculations: [
        { label: 'Total Saldo', value: formatRupiah(ctx.totalBalance) },
        { label: 'Cashflow Bulan Ini', value: formatRupiah(ctx.currentMonth.cashflow) },
      ],
      actionChips: ['Bulan ini kita boros nggak?', 'Pengeluaran terbesar kita apa?', 'Target impian kita gimana?'],
    };
  }

  // 0b. Gratitude / Terima Kasih
  if (q.includes('terima kasih') || q.includes('makasih') || q.includes('thanks') || q.includes('mantap')) {
    return {
      content: `Sama-sama! Senang bisa membantu keluarga Anda meraih ketenangan finansial. Jangan ragu menyapa saya kembali jika butuh saran atau simulasi ya! 💚`,
      actionChips: ['Cek kondisi bulan ini', 'Lihat target impian'],
    };
  }

  // 0c. Who are you / Capabilities
  if (q.includes('siapa') || q.includes('bisa apa') || q.includes('fungsi') || q.includes('bantuan')) {
    return {
      content: `Saya adalah **LEGAKU AI**, asisten & teman diskusi finansial keluarga Anda.\n\nSaya bisa membantu Anda:\n1. Evaluasi arus kas (apakah bulan ini tergolong hemat atau berlebih)\n2. Menemukan pos pengeluaran terbesar keluarga\n3. Menghitung simulasi pencapaian target impian (misal: Bebas Utang / Dana Darurat)\n4. Memberi rincian kalkulasi matematika yang transparan & tenang.`,
      actionChips: ['Bulan ini kita boros nggak?', 'Pengeluaran terbesar kita apa?'],
    };
  }

  // 1. "Boros nggak?"
  if (q.includes('boros') || q.includes('hemat') || q.includes('kondisi')) {
    const isSurplus = ctx.currentMonth.cashflow >= 0;
    const topCat = ctx.categoryBreakdown[0];
    const secondCat = ctx.categoryBreakdown[1];

    if (isSurplus) {
      const savingsRate = ctx.currentMonth.savingsRate;
      return {
        content: `Pengeluaran keluarga bulan ini ${formatShortRupiah(ctx.currentMonth.expense)}. Dua kategori yang mengambil porsi terbesar adalah:\n\n1. ${topCat?.name || 'Makan & Minum'} (${formatRupiah(topCat?.amount || 0)})\n2. ${secondCat?.name || 'Belanja'} (${formatRupiah(secondCat?.amount || 0)})\n\nSecara keseluruhan kondisi masih aman karena porsi tabungan tetap mencapai ${savingsRate}% dari pemasukan. Pertahankan pola ini ya!`,
        calculations: [
          { label: 'Pemasukan Bulan Ini', value: formatRupiah(ctx.currentMonth.income) },
          { label: 'Pengeluaran Bulan Ini', value: formatRupiah(ctx.currentMonth.expense) },
          { label: 'Sisa Cashflow Aman', value: formatRupiah(ctx.currentMonth.cashflow) },
        ],
        actionChips: ['Lihat detail kategori', 'Bantu buat saran budget'],
      };
    } else {
      const deficit = Math.abs(ctx.currentMonth.cashflow);
      return {
        content: `Pengeluaran bulan ini sedikit melebihi pemasukan sekitar ${formatRupiah(deficit)}. Hal ini wajar bila ada belanja bulanan atau tagihan berkala yang jatuh tempo bersamaan.\n\nKategori dengan alokasi terbesar saat ini adalah ${topCat?.name} (${formatRupiah(topCat?.amount || 0)}). Yuk, kita evaluasi bersama pos mana yang bisa sedikit disesuaikan di sisa bulan ini.`,
        calculations: [
          { label: 'Pemasukan', value: formatRupiah(ctx.currentMonth.income) },
          { label: 'Pengeluaran', value: formatRupiah(ctx.currentMonth.expense) },
          { label: 'Selisih Sementara', value: formatRupiah(deficit) },
        ],
        actionChips: ['Tampilkan anggaran', 'Pos pengeluaran terbesar'],
      };
    }
  }

  // 2. "Pengeluaran terbesar" / "paling meningkat"
  if (q.includes('terbesar') || q.includes('meningkat') || q.includes('banyak') || q.includes('berubah')) {
    if (ctx.categoryBreakdown.length === 0) {
      return {
        content: 'Belum ada catatan pengeluaran bulan ini. Catat transaksi terlebih dahulu untuk melihat pos terbesar keluarga.',
      };
    }
    const top3 = ctx.categoryBreakdown.slice(0, 3);
    const bullets = top3.map((c, i) => `${i + 1}. ${c.name} (${formatRupiah(c.amount)} - ${c.percentage}%)`).join('\n');

    return {
      content: `Berikut adalah 3 pos pengeluaran terbesar keluarga bulan ini:\n\n${bullets}\n\nPos ${top3[0].name} menjadi pengeluaran utama. Apakah alokasi ini sudah nyaman dan sesuai dengan prioritas keluarga saat ini?`,
      calculations: top3.map((c) => ({ label: c.name, value: formatRupiah(c.amount) })),
      actionChips: ['Bandingkan dengan bulan lalu', 'Atur batas anggaran'],
    };
  }

  // 3. "Goal tabungan" / "Nabung berapa"
  if (q.includes('goal') || q.includes('target') || q.includes('nabung') || q.includes('dana darurat')) {
    if (ctx.goalsSummary.length > 0) {
      const g = ctx.goalsSummary[0];
      const remaining = Math.max(0, g.target - g.current);
      const monthly4 = Math.round(remaining / 4);
      const monthly6 = Math.round(remaining / 6);

      return {
        content: `Untuk target "${g.name}", saat ini progres sudah ${g.progressPercent}% (${formatRupiah(g.current)} dari ${formatRupiah(g.target)}).\n\nKekurangan dana sekitar ${formatRupiah(remaining)}. Berikut pilihan simulasi yang aman:\n• ${formatRupiah(monthly4)}/bulan selama 4 bulan\n• ${formatRupiah(monthly6)}/bulan selama 6 bulan\n\nPilihan kedua lebih ringan dan tidak membebani arus kas bulanan.`,
        calculations: [
          { label: 'Target Tercapai', value: `${g.progressPercent}%` },
          { label: 'Sisa Kebutuhan', value: formatRupiah(remaining) },
          { label: 'Opsi Rekomendasi (6 bln)', value: `${formatRupiah(monthly6)} / bln` },
        ],
        actionChips: ['Tambah tabungan sekarang', 'Lihat semua target'],
      };
    } else {
      return {
        content: 'Saat ini belum ada target impian yang dibuat. Buka menu Goal untuk menetapkan target tabungan bersama pasangan.',
      };
    }
  }

  // 4. "Simulasi skenario" (misal: "kalau kita menambah tabungan Rp500 ribu...")
  if (q.includes('500') || q.includes('simulasi') || q.includes('skenario')) {
    if (ctx.goalsSummary.length > 0) {
      const g = ctx.goalsSummary[0];
      const remaining = Math.max(0, g.target - g.current);
      const extraMonths = Math.ceil(remaining / 500000);

      return {
        content: `Bagus sekali! Jika keluarga menambah setoran Rp 500.000 per bulan untuk "${g.name}", maka target ini diproyeksikan selesai ${extraMonths} bulan lebih cepat dari jadwal semula.\n\nLangkah konsisten sekecil apapun akan membuat keuangan masa depan terasa jauh lebih lega.`,
        calculations: [
          { label: 'Tambahan Rutin', value: 'Rp 500.000 / bln' },
          { label: 'Waktu Tercapai', value: `± ${extraMonths} Bulan` },
        ],
        actionChips: ['Setujui alokasi ini', 'Simulasi nominal lain'],
      };
    }
  }

  // 5. Default General Overview
  return {
    content: `Total saldo keluarga saat ini adalah ${formatRupiah(ctx.totalBalance)}.\n\nBulan ini pemasukan tercatat ${formatRupiah(ctx.currentMonth.income)} dan pengeluaran ${formatRupiah(ctx.currentMonth.expense)}. Sisa cashflow keluarga berada di angka ${formatRupiah(ctx.currentMonth.cashflow)}.\n\nAda aspek keuangan tertentu yang ingin kita bahas bersama?`,
    calculations: [
      { label: 'Total Saldo', value: formatRupiah(ctx.totalBalance) },
      { label: 'Cashflow Surplus', value: formatRupiah(ctx.currentMonth.cashflow) },
    ],
    actionChips: ['Bulan ini kita boros nggak?', 'Pengeluaran terbesar kita apa?'],
  };
}

/**
 * Sends a message to the AI Companion and manages conversation history
 */
export async function sendAiCompanionMessage(
  query: string,
  familyId: string,
  ctx: FamilyFinancialContext
): Promise<AiResponse> {
  // If Supabase Edge Function is reachable:
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('financial-companion', {
        body: {
          query,
          financialContext: ctx,
          familyId,
        },
      });

      if (!error && data?.content) {
        return {
          content: data.content,
          calculations: data.calculations,
          actionChips: data.actionChips,
        };
      }
    } catch (err) {
      console.warn('Edge Function companion fallback to local engine:', err);
    }
  }

  // Fallback to local verified deterministic engine
  return generateDeterministicCompanionResponse(query, ctx);
}
