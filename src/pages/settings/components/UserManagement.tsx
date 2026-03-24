import { useState, useEffect } from 'react';
import { listUsers, createUser, getUserBranches, replaceUserBranches, type OrgUser } from '../../../services/users.service';
import { listBranches, type Branch } from '../../../services/branches.service';
import { useAuth } from '../../../context/AuthContext';

const ROLE_ID_LABELS: Record<number, string> = { 1: 'Admin', 2: 'Owner', 3: 'Usuario' };
const ROLE_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-purple-100 text-purple-700',
  3: 'bg-green-100 text-green-700',
};
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Activo', INVITED: 'Invitado' };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INVITED: 'bg-yellow-100 text-yellow-700',
};

const emptyForm = { name: '', email: '', username: '', password: '', roleId: 3, orgId: '', branchIds: [] as number[] };

export default function UserManagement() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roleId === 1;

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  const [editUser, setEditUser] = useState<OrgUser | null>(null);
  const [editBranchIds, setEditBranchIds] = useState<number[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await listUsers({ pageSize: 100 });
      setUsers(res.items);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (!isAdmin) {
      listBranches().then(res => setBranches(res.items)).catch(() => setBranches([]));
    }
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, roleId: isAdmin ? 2 : 3 });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = async (user: OrgUser) => {
    setEditUser(user);
    setEditError('');
    setEditBranchIds([]);
    try {
      const res = await getUserBranches(user.id);
      setEditBranchIds(res.items.map(b => b.id));
    } catch {
      setEditBranchIds([]);
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    setEditError('');
    try {
      await replaceUserBranches(editUser.id, editBranchIds);
      setEditUser(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg || 'Error al guardar los cambios');
    } finally {
      setEditSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError('El nombre es obligatorio');
    if (!form.username.trim()) return setFormError('El nombre de usuario es obligatorio');
    if (!form.email.trim()) return setFormError('El email es obligatorio');
    if (form.password.length < 8) return setFormError('La contrasena debe tener al menos 8 caracteres');
    if (isAdmin && form.roleId !== 2 && !form.orgId.trim()) {
      return setFormError('El ID de organización es obligatorio para usuarios no-Owner');
    }
    setSaving(true);
    setFormError('');
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        roleId: form.roleId,
        orgId: isAdmin && form.roleId !== 2 && form.orgId ? Number(form.orgId) : undefined,
        branches: !isAdmin && form.branchIds.length > 0 ? form.branchIds : undefined,
      });
      setShowModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Error al crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const invitedCount = users.filter(u => u.status === 'INVITED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Gestion de Usuarios</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {isAdmin ? 'Crea y gestiona Owners y usuarios del sistema' : 'Administra los usuarios de tu organizacion'}
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer min-h-[48px] w-full sm:w-auto">
          <i className="ri-user-add-line"></i>
          {isAdmin ? 'Nuevo Owner / Usuario' : 'Nuevo Usuario'}
        </button>
      </div>

      {isAdmin && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <i className="ri-shield-star-line text-red-500 text-lg mt-0.5 shrink-0"></i>
          <div>
            <p className="text-sm font-semibold text-red-700">Modo Administrador</p>
            <p className="text-xs text-red-600 mt-0.5">Podés crear Owners (sin org) o Usuarios asignados a una org específica. Los Owners deben configurar su organización tras el primer login.</p>
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <i className="ri-checkbox-circle-line text-lg"></i>
          Usuario creado correctamente
        </div>
      )}

      {!isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { count: users.length, label: 'Usuarios', color: 'bg-blue-100 text-blue-700' },
            { count: activeCount, label: 'Activos', color: 'bg-green-100 text-green-700' },
            { count: invitedCount, label: 'Invitados', color: 'bg-yellow-100 text-yellow-700' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold ${s.color}`}>{s.count}</div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xs md:text-sm font-semibold text-gray-700">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {isAdmin ? 'Los usuarios de cada organización son visibles por sus Owners.' : 'No hay usuarios. Crea el primero.'}
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Login</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  {!isAdmin && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-white font-bold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{user.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.roleId] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_ID_LABELS[user.roleId] || `Rol ${user.roleId}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[user.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[user.status] || user.status}
                      </span>
                    </td>
                    {!isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(user)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-100 text-brand-500 cursor-pointer" title="Editar sucursales">
                          <i className="ri-edit-line text-sm"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-white font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">{user.username}</p>
                    {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.roleId] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_ID_LABELS[user.roleId] || `Rol ${user.roleId}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[user.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[user.status] || user.status}
                    </span>
                    {!isAdmin && (
                      <button onClick={() => openEdit(user)} className="mt-1 text-xs text-brand-500 hover:text-brand-700 cursor-pointer flex items-center gap-1">
                        <i className="ri-edit-line"></i> Editar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal edición de sucursales */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-800">Editar usuario</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editUser.name} · @{editUser.username}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sucursales asignadas</label>
                {branches.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay sucursales creadas todavía.</p>
                ) : (
                  <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {branches.map(b => (
                      <label key={b.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editBranchIds.includes(b.id)}
                          onChange={e => setEditBranchIds(ids =>
                            e.target.checked ? [...ids, b.id] : ids.filter(id => id !== b.id)
                          )}
                          className="w-4 h-4 accent-brand-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-brand-600">{b.name}</span>
                        {b.address && <span className="text-xs text-gray-400 truncate">{b.address}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {editError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <i className="ri-error-warning-line"></i>
                  {editError}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer">
                {editSaving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-md overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">Nuevo Usuario</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">

              {/* Selector de rol — solo visible para Admin */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rol *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 2, label: 'Owner', desc: 'Gestiona una organización', icon: 'ri-building-line', color: 'purple' },
                      { id: 3, label: 'Usuario', desc: 'Acceso a una organización', icon: 'ri-user-line', color: 'green' },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setForm({ ...form, roleId: r.id, orgId: '' })}
                        className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          form.roleId === r.id
                            ? r.color === 'purple' ? 'border-purple-500 bg-purple-50' : 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg mb-1.5 ${
                          form.roleId === r.id
                            ? r.color === 'purple' ? 'bg-purple-100' : 'bg-green-100'
                            : 'bg-gray-100'
                        }`}>
                          <i className={`${r.icon} text-sm ${
                            form.roleId === r.id
                              ? r.color === 'purple' ? 'text-purple-600' : 'text-green-600'
                              : 'text-gray-500'
                          }`}></i>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                  {form.roleId === 2 && (
                    <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mt-2">
                      <i className="ri-information-line mr-1"></i>
                      El Owner se crea sin organización. Deberá configurarla tras su primer login.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Juan Perez" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Ej: juan@email.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de usuario *</label>
                <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Sin espacios, ej: juanperez" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contrasena * (min. 8 caracteres)</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimo 8 caracteres" className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer w-8 h-8 flex items-center justify-center">
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>

              {/* Sucursales — solo para Owner creando un Usuario */}
              {!isAdmin && branches.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sucursales asignadas</label>
                  <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {branches.map(b => (
                      <label key={b.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.branchIds.includes(b.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            branchIds: e.target.checked
                              ? [...f.branchIds, b.id]
                              : f.branchIds.filter(id => id !== b.id),
                          }))}
                          className="w-4 h-4 accent-brand-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-brand-600">{b.name}</span>
                        {b.address && <span className="text-xs text-gray-400 truncate">{b.address}</span>}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">El usuario podrá operar en las sucursales seleccionadas</p>
                </div>
              )}

              {/* orgId — solo para Admin creando un Usuario (no Owner) */}
              {isAdmin && form.roleId !== 2 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID de Organización *</label>
                  <input
                    type="number"
                    value={form.orgId}
                    onChange={e => setForm({ ...form, orgId: e.target.value })}
                    placeholder="Ej: 1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                  />
                  <p className="text-xs text-gray-400 mt-1">ID numérico de la organización a la que pertenecerá este usuario</p>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <i className="ri-error-warning-line"></i>
                  {formError}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm cursor-pointer min-h-[48px]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold transition-all text-sm cursor-pointer min-h-[48px]">
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Creando...</> : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
