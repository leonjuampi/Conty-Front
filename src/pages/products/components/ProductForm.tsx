import { useState, useEffect, useRef } from 'react';
import {
  listProducts,
  listProductImages,
  addProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  MAX_PRODUCT_IMAGES,
} from '../../../services/products.service';
import type { ComboItem, ProductImage } from '../../../services/products.service';
import { getElaborationSettings } from '../../../services/elaborationCosts.service';
import { VariantsSection } from './VariantsSection';

interface ProductFormProps {
  product: any;
  categories?: string[];
  onSave: (product: any) => void;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = ['Pizzas', 'Empanadas', 'Bebidas', 'Postres', 'Otros'];

export function ProductForm({ product, categories, onSave, onClose }: ProductFormProps) {
  const availableCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    barcode: '',
    cost: '',
    price: '',
    image: '',
    active: true,
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Modo edición: imágenes ya guardadas en el backend
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  // Modo creación: archivos locales pendientes de subir
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPrimaryIdx, setNewPrimaryIdx] = useState(0);
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [comboSearch, setComboSearch] = useState('');
  const [comboResults, setComboResults] = useState<{ variantId: number; variantName: string; productName: string; price: number; cost: number }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [costosLocal, setCostosLocal] = useState(0);

  useEffect(() => {
    getElaborationSettings().then(s => setCostosLocal(s.monthly_local_cost)).catch(() => {});
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        barcode: product.barcode,
        cost: product.cost.toString(),
        price: product.price.toString(),
        image: product.image,
        active: product.active,
      });
      setIsCombo(product.isCombo ?? false);
      setComboItems(product.comboItems ?? []);

      // Cargar imágenes del producto existente
      setImagesLoading(true);
      listProductImages(product.id)
        .then(res => setImages(res.items))
        .catch(() => setImages([]))
        .finally(() => setImagesLoading(false));
    }
  }, [product]);

  const isEditing = !!product;
  const totalImages = isEditing ? images.length : newFiles.length;
  const canAddMore = totalImages < MAX_PRODUCT_IMAGES;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (isEditing) {
      try {
        const res = await addProductImage(product.id, file);
        setImages(prev => [...prev, res.image]);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Error al subir la imagen';
        alert(msg);
      }
    } else {
      if (newFiles.length >= MAX_PRODUCT_IMAGES) return;
      setNewFiles(prev => [...prev, file]);
    }
  };

  const handleRemoveImage = async (imageOrIdx: ProductImage | number) => {
    if (isEditing && typeof imageOrIdx !== 'number') {
      const img = imageOrIdx;
      if (!confirm('¿Eliminar esta imagen?')) return;
      try {
        await deleteProductImage(product.id, img.id);
        setImages(prev => {
          const remaining = prev.filter(i => i.id !== img.id);
          // Si borramos la principal, el backend ya promovió la siguiente. Reflejamos localmente.
          if (img.is_primary && remaining.length > 0) {
            remaining[0] = { ...remaining[0], is_primary: 1 };
          }
          return remaining;
        });
      } catch {
        alert('Error al eliminar la imagen');
      }
    } else if (!isEditing && typeof imageOrIdx === 'number') {
      const idx = imageOrIdx;
      setNewFiles(prev => prev.filter((_, i) => i !== idx));
      setNewPrimaryIdx(prev => {
        if (idx < prev) return prev - 1;
        if (idx === prev) return 0;
        return prev;
      });
    }
  };

  const handleSetPrimary = async (imageOrIdx: ProductImage | number) => {
    if (isEditing && typeof imageOrIdx !== 'number') {
      const img = imageOrIdx;
      if (img.is_primary) return;
      try {
        await setPrimaryProductImage(product.id, img.id);
        setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === img.id ? 1 : 0 })));
      } catch {
        alert('Error al marcar como principal');
      }
    } else if (!isEditing && typeof imageOrIdx === 'number') {
      setNewPrimaryIdx(imageOrIdx);
    }
  };

  // Buscar productos para agregar como componentes del combo
  useEffect(() => {
    if (!comboSearch.trim() || comboSearch.length < 2) { setComboResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await listProducts({ search: comboSearch, status: 'ACTIVE', limit: 20 });
        const results = res.items
          .filter(p => !p.isCombo) // no se puede agregar un combo dentro de un combo
          .flatMap(p =>
            p.variants.map(v => ({
              variantId: v.id,
              variantName: v.name === 'default' ? '' : v.name,
              productName: p.name,
              price: v.price,
              cost: v.cost ?? 0,
            }))
          );
        setComboResults(results);
      } catch { setComboResults([]); }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [comboSearch]);

  const addComboItem = (item: { variantId: number; variantName: string; productName: string; price: number; cost: number }) => {
    if (comboItems.some(c => c.variantId === item.variantId)) return;
    setComboItems([...comboItems, { variantId: item.variantId, qty: 1, variantName: item.variantName, productName: item.productName, price: item.price, cost: item.cost }]);
    setComboSearch('');
    setComboResults([]);
  };

  const removeComboItem = (variantId: number) => {
    setComboItems(comboItems.filter(c => c.variantId !== variantId));
  };

  const updateComboQty = (variantId: number, qty: number) => {
    setComboItems(comboItems.map(c => c.variantId === variantId ? { ...c, qty } : c));
  };

  // Recalcular costo y precio al cambiar los componentes del combo.
  // Solo cuando los items tienen precio (agregados desde el buscador, no cargados del backend).
  useEffect(() => {
    if (!isCombo || comboItems.length === 0) return;
    if (comboItems.every(c => c.price === undefined)) return;
    const totalCost = comboItems.reduce((sum, c) => sum + ((c.cost ?? 0) * c.qty), 0);
    const totalPrice = comboItems.reduce((sum, c) => sum + ((c.price ?? 0) * c.qty), 0);
    setFormData(prev => ({ ...prev, cost: totalCost.toString(), price: totalPrice.toString() }));
  }, [comboItems, isCombo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.cost || !formData.price) return;
    if (isCombo && comboItems.length === 0) {
      alert('El combo debe tener al menos 1 componente.');
      return;
    }
    onSave({
      ...formData,
      description: formData.description,
      // En modo creación no hay URL previa: la imagen se genera al subir.
      // En modo edición, la gestión ya se hizo on-the-fly contra el backend.
      image: isEditing ? formData.image : '',
      newImageFiles: !isEditing ? newFiles : undefined,
      newPrimaryIdx: !isEditing ? newPrimaryIdx : undefined,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      isCombo,
      comboItems: isCombo ? comboItems : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-0 md:p-4 overflow-y-auto">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-2xl md:my-8 md:max-h-[90vh] overflow-y-auto safe-top">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brand-500 to-brand-600 z-10 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer w-10 h-10 flex items-center justify-center">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">

          {/* Toggle combo */}
          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-purple-800">Producto combo</p>
              <p className="text-xs text-purple-600 mt-0.5">Agrupá varios productos en uno con precio especial</p>
            </div>
            <button type="button" onClick={() => setIsCombo(!isCombo)}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${isCombo ? 'bg-purple-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isCombo ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isCombo ? 'Nombre del combo' : 'Nombre del Producto'} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                placeholder={isCombo ? 'Ej: Combo Fernet + Coca' : 'Ej: Pizza Muzzarella'}
                required />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
                <span className="ml-2 text-xs font-normal text-gray-400">(se muestra en la tienda online)</span>
              </label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm"
                placeholder="Ej: Pizza artesanal con salsa de tomate, muzzarella y orégano." />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría <span className="text-red-500">*</span></label>
              <select value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px] cursor-pointer" required>
                <option value="">Seleccionar categoría</option>
                {availableCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>

            {/* SKU/Barcode — solo para no-combos */}
            {!isCombo && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Barras</label>
                <input type="text" value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="7790001234567" />
              </div>
            )}

            {/* Costo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Costo <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="1200" required min="0" step="0.01" />
              </div>
              {costosLocal > 0 && (
                <div className="mt-1.5 flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-xs text-gray-500">Costo Final (+ gastos del local)</span>
                  <span className="text-xs font-semibold text-gray-800">
                    ${(parseFloat(formData.cost || '0') + costosLocal).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isCombo ? 'Precio final del combo' : 'Precio de Venta'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="2500" required min="0" step="0.01" />
              </div>
            </div>

            {/* Imágenes */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Imágenes del producto
                  <span className="ml-2 text-xs font-normal text-gray-400">(hasta {MAX_PRODUCT_IMAGES}, la principal se usa en el POS)</span>
                </label>
                <span className="text-xs text-gray-500">{totalImages}/{MAX_PRODUCT_IMAGES}</span>
              </div>

              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                onChange={handleFileSelect} />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {isEditing
                  ? images.map((img) => (
                      <div key={img.id} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${img.is_primary ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'}`}>
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        {img.is_primary === 1 && (
                          <div className="absolute top-1 left-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <i className="ri-star-fill text-[10px]"></i>
                            <span>POS</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.is_primary && (
                            <button type="button" onClick={() => handleSetPrimary(img)}
                              title="Marcar como principal"
                              className="w-8 h-8 rounded-full bg-white text-brand-600 hover:bg-brand-50 flex items-center justify-center cursor-pointer">
                              <i className="ri-star-line"></i>
                            </button>
                          )}
                          <button type="button" onClick={() => handleRemoveImage(img)}
                            title="Eliminar"
                            className="w-8 h-8 rounded-full bg-white text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  : newFiles.map((file, idx) => {
                      const isPrimary = idx === newPrimaryIdx;
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${isPrimary ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'}`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          {isPrimary && (
                            <div className="absolute top-1 left-1 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <i className="ri-star-fill text-[10px]"></i>
                              <span>POS</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!isPrimary && (
                              <button type="button" onClick={() => handleSetPrimary(idx)}
                                title="Marcar como principal"
                                className="w-8 h-8 rounded-full bg-white text-brand-600 hover:bg-brand-50 flex items-center justify-center cursor-pointer">
                                <i className="ri-star-line"></i>
                              </button>
                            )}
                            <button type="button" onClick={() => handleRemoveImage(idx)}
                              title="Quitar"
                              className="w-8 h-8 rounded-full bg-white text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer">
                              <i className="ri-close-line"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })
                }

                {canAddMore && !imagesLoading && (
                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-brand-400 bg-brand-50/40 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <i className="ri-image-add-line text-2xl text-brand-400"></i>
                    <span className="text-xs text-brand-500 font-medium text-center px-1">Agregar</span>
                  </button>
                )}

                {imagesLoading && (
                  <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin text-brand-500 text-xl"></i>
                  </div>
                )}
              </div>

              {totalImages === 0 && !imagesLoading && (
                <p className="mt-2 text-xs text-gray-400">JPG, PNG, WebP · máx. 5MB cada una</p>
              )}
            </div>

            {/* Activo */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer min-h-[48px]">
                <input type="checkbox" checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-brand-500 border-gray-300 rounded focus:ring-brand-500 cursor-pointer" />
                <span className="text-sm font-semibold text-gray-700">{isCombo ? 'Combo activo' : 'Producto activo'}</span>
              </label>
            </div>
          </div>

          {/* Sección Componentes del Combo */}
          {isCombo && (
            <div className="border-2 border-purple-200 rounded-xl p-4 space-y-4 bg-purple-50/30">
              <div>
                <h3 className="text-sm font-bold text-purple-800 mb-1">Componentes del combo</h3>
                <p className="text-xs text-purple-600">Seleccioná los productos que forman el combo.</p>
              </div>

              {/* Lista de componentes */}
              {comboItems.length > 0 && (
                <div className="space-y-2">
                  {comboItems.map(item => (
                    <div key={item.variantId} className="flex items-center gap-3 bg-white border border-purple-200 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs text-gray-500">Cant.</label>
                        <input type="number" value={item.qty} min={1} step={1}
                          onChange={e => updateComboQty(item.variantId, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center" />
                        <button type="button" onClick={() => removeComboItem(item.variantId)}
                          className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <i className="ri-close-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Buscador de productos */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  <i className="ri-add-line mr-1"></i>Agregar producto
                </label>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-purple-400">
                  <i className="ri-search-line text-gray-400 text-sm shrink-0"></i>
                  <input type="text" value={comboSearch} onChange={e => setComboSearch(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    className="flex-1 text-sm outline-none bg-transparent" />
                  {searchLoading && <i className="ri-loader-4-line animate-spin text-purple-400 text-sm shrink-0"></i>}
                </div>

                {comboResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                    {comboResults.map(r => (
                      <button key={r.variantId} type="button" onClick={() => addComboItem(r)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.productName}</p>
                          {r.variantName && <p className="text-xs text-gray-500">{r.variantName}</p>}
                        </div>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">${r.price.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {comboItems.length === 0 && (
                <p className="text-xs text-purple-500 text-center py-2">El combo debe incluir al menos 1 producto.</p>
              )}
            </div>
          )}

          {/* Variantes - solo para productos existentes y no-combos */}
          {product && !isCombo && (
            <VariantsSection
              productId={product.id}
              hasVariants={product.hasVariants ?? false}
              onVariantsToggled={() => {}}
            />
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit"
              className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 md:py-4 rounded-lg font-semibold hover:from-brand-600 hover:to-brand-700 cursor-pointer text-sm md:text-base min-h-[52px]">
              <i className="ri-save-line mr-2"></i>
              {product ? 'Guardar Cambios' : (isCombo ? 'Crear Combo' : 'Crear Producto')}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-white text-gray-700 py-3 md:py-4 rounded-lg font-semibold hover:bg-gray-100 border border-gray-300 cursor-pointer text-sm md:text-base min-h-[52px]">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
