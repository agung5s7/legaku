import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { extractReceiptInformation } from '../../services/receiptService';
import { useFinance } from '../../context/FinanceContext';
import { useFamily } from '../../context/FamilyContext';
import { ReceiptExtractionResult } from '../../types';
import { Camera, Upload, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface ReceiptScannerProps {
  onExtractionComplete: (result: ReceiptExtractionResult) => void;
  onCancel: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onExtractionComplete,
  onCancel,
}) => {
  const { categories } = useFinance();
  const { family } = useFamily();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await extractReceiptInformation(
        selectedFile,
        family?.id || 'demo-family',
        categories
      );

      if (!result.total_amount && result.items.length === 0) {
        setErrorMessage('Struknya belum cukup jelas untuk dibaca. Pastikan foto tegak lurus dan pencahayaan terang.');
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);
      onExtractionComplete(result);
    } catch (err: any) {
      console.error('Error extracting receipt:', err);
      const rawMsg = err?.message || '';
      const isTechnical = /edge function|non-2xx|status code|functionshttperror|failed to fetch|unauthorized/i.test(rawMsg);
      const displayMsg = !rawMsg || isTechnical
        ? 'Struk belum berhasil terbaca dengan jelas. Pastikan foto tegak lurus, pencahayaan cukup terang, dan tidak buram.'
        : rawMsg;
      setErrorMessage(displayMsg);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {!imagePreview ? (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-sage-300 hover:border-forest-600 bg-cream-50/70 hover:bg-sage-50/50 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 shadow-soft group"
          >
            <div className="w-16 h-16 rounded-3xl bg-forest-800 text-warm-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-forest-950">Foto atau Unggah Struk</h3>
              <p className="text-xs text-warm-muted max-w-xs mx-auto mt-1 leading-relaxed">
                Ambil foto struk belanjaan supermarket, restoran, minimarket, atau SPBU. AI LEGAKU akan mengekstrak data belanja Anda.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-white border border-warm-border text-forest-800 font-medium flex items-center gap-1.5 shadow-soft">
                <Upload className="w-3.5 h-3.5" />
                Pilih dari Galeri / Kamera
              </span>
            </div>
          </div>

          <div className="bg-sage-50/70 border border-sage-200/60 rounded-2xl p-3 flex items-start gap-2.5 text-left">
            <Sparkles className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-forest-900 leading-relaxed">
              <span className="font-semibold text-forest-950">Tips scan optimal:</span> Posisikan kamera tegak lurus di atas struk, pastikan tulisan tajam/tidak blur, dan hindari pantulan cahaya pada kertas struk.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Viewfinder Receipt Preview with Laser Scan Effect */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-forest-800/30 bg-warm-dark max-h-80 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Pratinjau Struk"
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isProcessing ? 'opacity-85 filter brightness-95' : 'opacity-100'
              }`}
            />

            {/* Viewfinder Corners */}
            <div className="absolute inset-4 pointer-events-none border border-white/30 rounded-2xl flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-5 h-5 border-t-2 border-l-2 border-sage-200" />
                <div className="w-5 h-5 border-t-2 border-r-2 border-sage-200" />
              </div>
              <div className="flex justify-between">
                <div className="w-5 h-5 border-b-2 border-l-2 border-sage-200" />
                <div className="w-5 h-5 border-b-2 border-r-2 border-sage-200" />
              </div>
            </div>

            {/* Scanning Laser Line Animation */}
            {isProcessing && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sage-300 to-transparent shadow-[0_0_15px_#8FB09A] animate-bounce" />
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-sage-200" />
                <p className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-earth-gold" />
                  Membaca struk dengan AI...
                </p>
                <p className="text-[10px] text-sage-200/80">Mendeteksi merchant, total belanja & tanggal</p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="bg-earth-terracotta/10 border border-earth-terracotta/20 text-earth-rust text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-earth-rust" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-earth-rust">{errorMessage}</p>
                <p className="text-[11px] text-warm-muted leading-relaxed">
                  Tips: Posisikan kamera tegak lurus, pastikan teks struk fokus/tajam, dan hindari pantulan cahaya pada kertas kasir.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-earth-rust hover:text-earth-rust/80 underline pt-1 inline-block"
                >
                  Coba Foto Lagi
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isProcessing}
              className="flex-1"
            >
              Foto Ulang
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isProcessing}
              onClick={handleProcessImage}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-earth-gold" />
              Proses dengan AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
