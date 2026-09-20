import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onBackToLanding }) => {
  const { login, register, switchDemoUser } = useAuth();

  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Mohon lengkapi email dan kata sandi.');
      return;
    }

    if (isRegister && !fullName.trim()) {
      setErrorMessage('Mohon lengkapi nama Anda.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const res = await register(email.trim(), password, fullName.trim());
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.requiresEmailConfirmation) {
          setEmailConfirmationSent(true);
        }
      } else {
        const res = await login(email.trim(), password);
        if (res.error) setErrorMessage(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantDemo = (userIndex = 0) => {
    switchDemoUser(userIndex);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7] flex flex-col justify-center items-center px-4 py-10 font-sans">
      <div className="w-full max-w-md space-y-6">
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs font-semibold text-[#144D3A] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Kembali ke Beranda
          </button>
        )}

        {/* Official Brand Header with 3-Leaf Mark */}
        <div className="text-center space-y-3">
          <Logo variant="full" size="lg" showTagline={true} />
          <p className="text-xs text-[#6B7280] max-w-xs mx-auto leading-relaxed pt-1">
            Teman keluarga untuk memahami uang, merencanakan masa depan, dan mengambil keputusan finansial dengan lebih tenang.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-7 shadow-soft space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#E8F2EC] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-white text-[#144D3A] shadow-sm font-bold'
                  : 'text-[#6B7280] hover:text-[#144D3A]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                isRegister
                  ? 'bg-white text-[#144D3A] shadow-sm font-bold'
                  : 'text-[#6B7280] hover:text-[#144D3A]'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {emailConfirmationSent ? (
            <div className="bg-[#E8F2EC] border border-[#2E7D61]/30 p-5 rounded-2xl text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-[#144D3A] text-white flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-[#D6C6AC]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-[#144D3A] text-base">Pendaftaran Berhasil!</h3>
                <p className="text-xs text-[#1F2937] leading-relaxed">
                  Tautan konfirmasi telah dikirim ke <strong>{email}</strong>.
                </p>
                <p className="text-[11px] text-[#6B7280] leading-relaxed pt-1">
                  Silakan buka kotak masuk atau spam email Anda, lalu klik tautan konfirmasi untuk mengaktifkan akun keluarga Anda.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full text-xs font-semibold py-2.5 cursor-pointer"
                  onClick={() => {
                    setEmailConfirmationSent(false);
                    setIsRegister(false);
                    setErrorMessage('');
                  }}
                >
                  Sudah Konfirmasi? Masuk Sekarang →
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Nama Lengkap"
                placeholder="Contoh: Andi Pratama"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus={isRegister}
              />
            )}

            <Input
              type="email"
              label="Alamat Email"
              placeholder="nama@keluarga.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type={showPassword ? 'text' : 'password'}
              label="Kata Sandi"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suffixElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#6B7280] hover:text-[#144D3A] transition-colors pointer-events-auto cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-[#EF4444] text-xs p-3 rounded-2xl">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full h-12 text-sm font-semibold rounded-2xl shadow-soft"
            >
              {isRegister ? 'Daftar Sekarang' : 'Masuk ke LEGAKU'}
            </Button>
          </form>
          )}

          {/* Quick Demo Preview Option */}
          <div className="pt-3 border-t border-[#E5E7EB] text-center space-y-2.5">
            <span className="text-[11px] text-[#6B7280] block">
              Ingin langsung mencoba tanpa mendaftar?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleInstantDemo(0)}
                className="text-xs py-2 font-medium"
              >
                Akun Andi (Suami)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleInstantDemo(1)}
                className="text-xs py-2 font-medium"
              >
                Akun Sinta (Istri)
              </Button>
            </div>
          </div>
        </div>

        {/* Security & Privacy Assurance */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#6B7280]">
          <Shield className="w-4 h-4 text-[#2E7D61]" />
          <span>Keamanan setara perbankan dengan enkripsi data keluarga.</span>
        </div>
      </div>
    </div>
  );
};
