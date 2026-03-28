import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { checkResetToken, resetPassword } from '../../services/auth.service';

type Status = 'checking' | 'valid' | 'invalid' | 'expired' | 'done';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>('checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    checkResetToken(token)
      .then(res => { setUsername(res.username); setStatus('valid'); })
      .catch(err => {
        const code = err?.response?.data?.error;
        setStatus(code === 'TOKEN_EXPIRED' ? 'expired' : 'invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setStatus('done');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (code === 'TOKEN_EXPIRED') { setStatus('expired'); return; }
      if (code === 'TOKEN_INVALID') { setStatus('invalid'); return; }
      if (code === 'WEAK_PASSWORD') { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
      setError('Ocurrió un error. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const card = (icon: string, iconColor: string, title: string, body: React.ReactNode) => (
    <div className="text-center space-y-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${iconColor}`}>
        <i className={`${icon} text-3xl`}></i>
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="text-gray-500 text-sm">{body}</div>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium">
        <i className="ri-arrow-left-line"></i> Volver al inicio de sesión
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="ri-store-3-line text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">Conty</h1>
            <p className="text-gray-500 text-xs">Sistema de Gestión</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {status === 'checking' && (
            <div className="text-center py-4">
              <i className="ri-loader-4-line animate-spin text-brand-500 text-3xl"></i>
              <p className="text-gray-500 text-sm mt-3">Verificando link...</p>
            </div>
          )}

          {status === 'invalid' && card(
            'ri-close-circle-line', 'bg-red-100 text-red-600',
            'Link inválido',
            <p>Este link de recuperación no es válido. Solicitá uno nuevo.</p>
          )}

          {status === 'expired' && card(
            'ri-time-line', 'bg-amber-100 text-amber-600',
            'Link expirado',
            <>
              <p>Este link ya expiró (tiene validez de 48 hs).</p>
              <Link to="/forgot-password" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2">
                Solicitar un nuevo link
              </Link>
            </>
          )}

          {status === 'done' && card(
            'ri-checkbox-circle-line', 'bg-green-100 text-green-600',
            '¡Contraseña actualizada!',
            <p>Tu contraseña fue cambiada correctamente. Redirigiendo al login...</p>
          )}

          {status === 'valid' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Nueva contraseña</h2>
                <p className="text-gray-500 text-sm">
                  Hola <span className="font-medium text-gray-700">{username}</span>, elegí una nueva contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <i className="ri-lock-line text-gray-400 text-lg"></i>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <i className={showPassword ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'}></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <i className="ri-lock-2-line text-gray-400 text-lg"></i>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repetí la contraseña"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                    <i className="ri-error-warning-line text-base"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <><i className="ri-loader-4-line animate-spin text-base"></i>Guardando...</>
                  ) : (
                    <><i className="ri-shield-check-line text-base"></i>Guardar nueva contraseña</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
