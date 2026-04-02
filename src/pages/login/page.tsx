
import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya está logueado, redirigir
  if (currentUser) {
    if (currentUser.roleId === 2 && !currentUser.orgId) {
      return <Navigate to="/setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const stored = localStorage.getItem('conty_token');
      if (stored) {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        // Owner sin org → onboarding
        if (payload.roleId === 2 && !payload.orgId) {
          navigate('/setup', { replace: true });
        } else if (!payload.branchId && payload.branchIds?.length > 1) {
          navigate('/select-branch', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      // MFA requerido → redirigir a pantalla de verificación
      const mfaErr = err as Error & { mfaToken?: string };
      if (mfaErr.message === 'MFA_REQUIRED' && mfaErr.mfaToken) {
        navigate('/mfa-verify', { state: { mfaToken: mfaErr.mfaToken }, replace: true });
        return;
      }

      const data = (err as { response?: { data?: { error?: string; message?: string; active?: number; max?: number } } })?.response?.data;
      if (data?.error === 'DEVICE_LIMIT_REACHED') {
        setError(`Este negocio ya alcanzó el límite de dispositivos habilitados (${data.active}/${data.max}). Contactá al administrador para liberar una licencia.`);
      } else {
        setError(data?.message || 'Usuario o contraseña incorrectos.');
      }
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
              Gestión simple,<br />resultados reales.
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed">
              Administrá pedidos, productos, clientes y reportes desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-10">
            <img src="/LOGO-COLOR-COMPLETO.png" alt="Conty" className="h-20" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
            <p className="text-gray-500 text-sm">Ingresá tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-user-line text-gray-400 text-lg"></i>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ingresá tu usuario"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400 text-lg"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  required
                  autoComplete="current-password"
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <i className="ri-error-warning-line text-base"></i>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-base"></i>
                  Ingresando...
                </>
              ) : (
                <>
                  <i className="ri-login-box-line text-base"></i>
                  Ingresar al sistema
                </>
              )}
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
