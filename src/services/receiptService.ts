import { Category, ReceiptExtractionResult, ReceiptItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Validates and compresses the receipt image before upload.
 */
async function compressImage(file: File): Promise<File> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Gunakan format JPG, PNG, atau WEBP.');
  }

  // max dimension 2000px, target size ~1MB
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 2000;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Gagal memproses gambar.'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Gagal mengompres gambar.'));
            const ext = file.name.split('.').pop() || 'jpg';
            const compressedFile = new File([blob], `receipt.${ext}`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('File gambar rusak atau tidak dapat dibaca.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Primary Receipt Extraction Entry Point
 */
export async function extractReceiptInformation(
  file: File,
  familyId: string,
  categories: Category[]
): Promise<ReceiptExtractionResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Sistem backend belum terkonfigurasi dengan benar.');
  }

  // 1. Compress Image
  const compressedFile = await compressImage(file);
  
  if (compressedFile.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran gambar masih terlalu besar setelah dikompres (Maksimal 5MB).');
  }

  // 2. Upload to private receipts bucket
  const fileName = `${familyId}/${Date.now()}-${compressedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('receipts')
    .upload(fileName, compressedFile, {
      contentType: compressedFile.type || 'image/jpeg',
      upsert: true,
    });

  if (uploadErr || !uploadData) {
    throw new Error('Gagal mengunggah gambar struk. Periksa koneksi internet Anda.');
  }

  // 3. Call Edge Function
  const { data: edgeData, error: fnErr } = await supabase.functions.invoke('process-receipt', {
    body: {
      storagePath: uploadData.path,
      familyId,
    },
  });

  if (fnErr) {
    console.error('Edge function error:', fnErr);
    throw new Error(fnErr.message || 'Struk belum berhasil dibaca. Pastikan foto cukup terang, tidak blur, dan seluruh struk terlihat.');
  }

  if (edgeData?.error) {
    console.error('Edge function returned error:', edgeData.error);
    throw new Error(edgeData.error);
  }

  // 4. Map Result
  if (!edgeData || (!edgeData.merchant_name && !edgeData.total_amount && (!edgeData.items || edgeData.items.length === 0))) {
     throw new Error('Struk belum berhasil dibaca. Pastikan foto cukup terang, tidak blur, dan seluruh struk terlihat.');
  }

  let matchedCatId = categories[0]?.id;
  let matchedCatName = categories[0]?.name || 'Belum Terkategori';

  if (edgeData.category_hint) {
    const matched = categories.find(
      (c) => c.name.toLowerCase().includes(edgeData.category_hint.toLowerCase())
    );
    if (matched) {
      matchedCatId = matched.id;
      matchedCatName = matched.name;
    }
  }
  
  // Convert items format slightly if needed
  const items: ReceiptItem[] = (edgeData.items || []).map((item: any) => ({
    name: item.name,
    quantity: item.quantity || 1,
    amount: item.total_price || item.unit_price || 0
  }));

  // Construct confidence object
  const conf = {
    merchant: edgeData.overall_confidence || 0.8,
    amount: edgeData.overall_confidence || 0.8,
    date: edgeData.overall_confidence || 0.8,
    category: edgeData.overall_confidence || 0.8
  };

  return {
    merchant_name: edgeData.merchant_name || 'Tidak diketahui',
    total_amount: edgeData.total_amount || 0,
    transaction_date: edgeData.transaction_date || new Date().toISOString().split('T')[0],
    transaction_time: edgeData.transaction_time || '12:00',
    suggested_category_id: matchedCatId,
    suggested_category_name: matchedCatName,
    items,
    confidence: conf,
    is_confident: edgeData.overall_confidence ? edgeData.overall_confidence >= 0.8 : true,
    imageUrl: URL.createObjectURL(compressedFile),
  };
}
