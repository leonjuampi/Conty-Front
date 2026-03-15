import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listBranches, Branch } from '../../services/branches.service';

export default function SelectBranchPage() {
  const { currentUser, switchBranch } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listBranches({ status: 'ACTIVE' })
      .then(res => setBranches(res.items))
      .catch(() => setError('Error al cargar las sucursales'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (branchId: number) => {
    setSelecting(branchId);
    setError('');
    try {
      await switchBranch(branchId);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Error al seleccionar la sucursal');
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="ri-store-2-line text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Seleccioná una sucursal</h1>
          <p className="text-gray-500 text-sm">
            Hola, <span className="font-semibold text-gray-700">{currentUser?.name}</span>. ¿Desde qué sucursal vas a trabajar hoy?
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            <i className="ri-error-warning-line"></i>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <i className="ri-loader-4-line animate-spin text-3xl text-orange-500"></i>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="ri-store-line text-4xl mb-2 block"></i>
            No tenés sucursales activas asignadas.
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                disabled={selecting !== null}
                className="w-full bg-white border-2 border-gray-100 hover:border-orange-300 rounded-2xl p-5 text-left transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 group-hover:from-orange-500 group-hover:to-red-600 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                    <i className="ri-store-line text-orange-500 group-hover:text-white text-xl transition-colors"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">{branch.name}</p>
                    {branch.address && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        <i className="ri-map-pin-line mr-1"></i>{branch.address}
                      </p>
                    )}
                    {branch.phone && (
                      <p className="text-sm text-gray-400 mt-0.5">
                        <i className="ri-phone-line mr-1"></i>{branch.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {selecting === branch.id ? (
                      <i className="ri-loader-4-line animate-spin text-orange-500 text-xl"></i>
                    ) : (
                      <i className="ri-arrow-right-line text-gray-300 group-hover:text-orange-500 text-xl transition-colors"></i>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
