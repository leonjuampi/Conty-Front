import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/LOGO-COLOR-COMPLETO.png" alt="Conty" className="h-14" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <i className="ri-mail-check-line text-green-600 text-3xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Revisá tu email</h2>
              <p className="text-gray-500 text-sm">
                Si el email <span className="font-medium text-gray-700">{email}</span> está registrado,
                vas a recibir un link para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-xs text-gray-400">Revisá también la carpeta de spam.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2"
              >
                <i className="ri-arrow-left-line"></i>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Olvidé mi contraseña</h2>
                <p className="text-gray-500 text-sm">
                  Ingresá tu email y te enviamos un link para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <i className="ri-mail-line text-gray-400 text-lg"></i>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      required
                      autoComplete="email"
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
                    <><i className="ri-loader-4-line animate-spin text-base"></i>Enviando...</>
                  ) : (
                    <><i className="ri-send-plane-line text-base"></i>Enviar link de recuperación</>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-arrow-left-line text-sm"></i>
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
