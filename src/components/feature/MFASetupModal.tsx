import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { mfaSetup, mfaVerifySetup, mfaStatus, mfaDisable, mfaRegenerateCodes } from '../../services/mfa.service';

interface Props {
  onClose: () => void;
}

type Step = 'loading' | 'status' | 'qr' | 'verify' | 'backup' | 'disable';

export function MFASetupModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>('loading');
  const [enabled, setEnabled] = useState(false);
  const [codesRemaining, setCodesRemaining] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await mfaStatus();
      setEnabled(s.enabled);
      setCodesRemaining(s.backupCodesRemaining);
      setStep('status');
    } catch {
      setStep('status');
    }
  };

  const handleSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await mfaSetup();
      setQrDataUrl(result.qrDataUrl);
      setSecret(result.secret);
      setStep('qr');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al iniciar configuración.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) { setError('Ingresá el código de 6 dígitos.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await mfaVerifySetup(code);
      setBackupCodes(result.backupCodes);
      setStep('backup');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Ingresá tu contraseña.'); return; }
    setError('');
    setLoading(true);
    try {
      await mfaDisable(password);
      setEnabled(false);
      setStep('status');
      setPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al desactivar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await mfaRegenerateCodes();
      setBackupCodes(result.backupCodes);
      setStep('backup');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al regenerar códigos.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    if (step === 'loading') {
      return (
        <div className="flex items-center justify-center py-12">
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      );
    }

    if (step === 'status') {
      return (
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl ${enabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-green-100' : 'bg-gray-200'}`}>
              <i className={`text-xl ${enabled ? 'ri-shield-check-line text-green-600' : 'ri-shield-line text-gray-500'}`}></i>
            </div>
            <div>
              <p className={`font-semibold text-sm ${enabled ? 'text-green-800' : 'text-gray-700'}`}>
                {enabled ? 'MFA activado' : 'MFA desactivado'}
              </p>
              <p className="text-xs text-gray-500">
                {enabled
                  ? `Códigos de respaldo restantes: ${codesRemaining}`
                  : 'Agregá una capa extra de seguridad a tu cuenta.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          {enabled ? (
            <div className="space-y-2">
              <button
                onClick={handleRegenerateCodes}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-sm cursor-pointer disabled:opacity-60"
              >
                <i className="ri-refresh-line"></i>
                Regenerar códigos de respaldo
              </button>
              <button
                onClick={() => { setStep('disable'); setError(''); setPassword(''); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm cursor-pointer"
              >
                <i className="ri-shield-cross-line"></i>
                Desactivar MFA
              </button>
            </div>
          ) : (
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-shield-check-line"></i>}
              Activar MFA
            </button>
          )}
        </div>
      );
    }

    if (step === 'qr') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Escaneá este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
            </p>
            <div className="bg-white p-4 rounded-xl border border-gray-200 inline-block">
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">O ingresá este código manualmente:</p>
            <p className="font-mono text-sm text-gray-800 break-all select-all">{secret}</p>
          </div>

          <button
            onClick={() => { setStep('verify'); setCode(''); setError(''); }}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Continuar
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      );
    }

    if (step === 'verify') {
      return (
        <form onSubmit={handleVerifySetup} className="space-y-4">
          <p className="text-sm text-gray-600">
            Ingresá el código de 6 dígitos que muestra tu aplicación para verificar que todo esté bien.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de verificación</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-center text-gray-900 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white transition-all"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('qr')}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-sm cursor-pointer"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <i className="ri-loader-4-line animate-spin"></i> : 'Verificar'}
            </button>
          </div>
        </form>
      );
    }

    if (step === 'backup') {
      return (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <i className="ri-alert-line text-amber-600 mt-0.5"></i>
              <p className="text-sm text-amber-800">
                Guardá estos códigos de respaldo en un lugar seguro. Los vas a necesitar si perdés acceso a tu aplicación de autenticación.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((c, i) => (
                <div key={i} className="font-mono text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-100 text-center">
                  {c}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={copyBackupCodes}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          >
            <i className={copied ? 'ri-check-line text-green-600' : 'ri-file-copy-line'}></i>
            {copied ? 'Copiados!' : 'Copiar códigos'}
          </button>

          <button
            onClick={() => { setEnabled(true); loadStatus(); setStep('status'); }}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="ri-check-double-line"></i>
            Listo, ya los guardé
          </button>
        </div>
      );
    }

    if (step === 'disable') {
      return (
        <form onSubmit={handleDisable} className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <i className="ri-alert-line text-red-600 mt-0.5"></i>
              <p className="text-sm text-red-800">
                Desactivar MFA reduce la seguridad de tu cuenta. Ingresá tu contraseña para confirmar.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña actual"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white transition-all"
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('status'); setError(''); }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <i className="ri-loader-4-line animate-spin"></i> : 'Desactivar MFA'}
            </button>
          </div>
        </form>
      );
    }

    return null;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-shield-keyhole-line text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Autenticación de dos factores</h2>
              <p className="text-brand-100 text-xs">Protegé tu cuenta con MFA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  );
}
