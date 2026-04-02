import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mfaVerifyLogin } from '../../services/mfa.service';
import { TOKEN_STORAGE_KEY } from '../../services/api';

export default function MfaVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateAuth } = useAuth();
  const mfaToken = (location.state as { mfaToken?: string })?.mfaToken;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  if (!mfaToken) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit cuando se completan los 6 dígitos
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      handleSubmit(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    if (pasted.length === 6) {
      handleSubmit(pasted);
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  };

  const handleSubmit = async (fullCode?: string) => {
    const token = fullCode || code.join('');
    if (token.length < 6) {
      setError('Ingresá el código de 6 dígitos.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const resp = await mfaVerifyLogin(token, mfaToken);
      localStorage.setItem(TOKEN_STORAGE_KEY, resp.token);
      updateAuth(resp.token, {
        id: resp.user.id,
        name: resp.user.name,
        email: resp.user.email,
        username: resp.user.username,
        roleId: resp.user.roleId,
        orgId: resp.user.orgId,
        branchId: resp.user.branchId,
        branchIds: resp.user.branchIds,
      });

      // Redirigir según el rol
      if (resp.user.roleId === 2 && !resp.user.orgId) {
        navigate('/setup', { replace: true });
      } else if (!resp.user.branchId && resp.user.branchIds?.length > 1) {
        navigate('/select-branch', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setError('Código inválido. Intentá de nuevo.');
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-900">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 70% 80%, #818cf8 0%, transparent 50%)' }} />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="mb-8">
            <div className="mb-6">
              <img src="/LOGO-BYN-COMPLETO.png" alt="Conty" className="h-20 brightness-0 invert" />
            </div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-3">
              Verificación<br />en dos pasos
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed">
              Ingresá el código de tu aplicación de autenticación para continuar.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden justify-center mb-10">
            <img src="/LOGO-COLOR-COMPLETO.png" alt="Conty" className="h-20" />
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-keyhole-line text-3xl text-brand-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificación MFA</h2>
            <p className="text-gray-500 text-sm">
              Ingresá el código de 6 dígitos de tu aplicación de autenticación o un código de respaldo.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* Code inputs */}
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <i className="ri-error-warning-line text-base"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-base"></i>
                  Verificando...
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line text-base"></i>
                  Verificar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Conty · Sistema de Gestión
          </p>
        </div>
      </div>
    </div>
  );
}
