export interface Ingrediente {
  nombre: string;
  costo: number | string;
  formula?: string;
}

export interface Preparacion {
  id: string;
  nombre: string;
  ingredientes: Ingrediente[];
}

export const preparaciones: Preparacion[] = [
  {
    id: '1',
    nombre: 'Pizza Muzza',
    ingredientes: [
      { nombre: 'Prepizza', costo: 0, formula: 'PREPIZZA' },
      { nombre: 'Queso Muzza', costo: 5100, formula: 'MUZZA / 4' },
      { nombre: 'Salsa', costo: 9500, formula: 'SALSA / 10' },
      { nombre: 'Aceituna', costo: 16000, formula: 'ACEITUNAS / 20' },
      { nombre: 'Caja Pizza', costo: 18000, formula: 'C.PIZZA / 50' },
      { nombre: 'Gas', costo: 150 }
    ]
  },
  {
    id: '2',
    nombre: 'Pizza Especial',
    ingredientes: [
      { nombre: 'Jamon', costo: 3300, formula: 'JAMON / 10' },
      { nombre: 'Huevo', costo: 5000, formula: 'HUEVOS / 30' },
      { nombre: 'Morron', costo: 200 },
      { nombre: 'Pizza Muzza (base)', costo: 0, formula: 'Pizza Muzza' },
      { nombre: 'Gas', costo: 150 }
    ]
  },
  {
    id: '3',
    nombre: 'Empanadas Carne',
    ingredientes: [
      { nombre: 'Picadillo', costo: 7000, formula: 'MOLIDA * 12 / 100' },
      { nombre: 'Tapas', costo: 800, formula: 'TAPAS / 12' },
      { nombre: 'Luz', costo: 50 },
      { nombre: 'Gas', costo: 100 },
      { nombre: 'Envoltorio', costo: 30 }
    ]
  },
  {
    id: '4',
    nombre: 'Empanadas Jamón y Queso',
    ingredientes: [
      { nombre: 'Jamón', costo: 3300, formula: 'JAMON * 12 / 100' },
      { nombre: 'Queso', costo: 5100, formula: 'MUZZA * 12 / 100' },
      { nombre: 'Tapa', costo: 800, formula: 'TAPAS / 12' },
      { nombre: 'Luz', costo: 50 },
      { nombre: 'Gas', costo: 100 },
      { nombre: 'Caja', costo: 18000, formula: 'C.PIZZA / 50' }
    ]
  },
  {
    id: '5',
    nombre: 'Empanadas Fugazza',
    ingredientes: [
      { nombre: 'Cebolla', costo: 300 },
      { nombre: 'Queso', costo: 5100, formula: 'MUZZA * 12 / 100' },
      { nombre: 'Tapa', costo: 800, formula: 'TAPAS / 12' },
      { nombre: 'Luz', costo: 50 },
      { nombre: 'Gas', costo: 100 },
      { nombre: 'Caja', costo: 18000, formula: 'C.PIZZA / 50' }
    ]
  },
  {
    id: '6',
    nombre: 'Preparación Hamburguesa',
    ingredientes: [
      { nombre: 'Molida', costo: 7000, formula: 'MOLIDA * 45 / 5000' },
      { nombre: 'Huevos', costo: 5000, formula: 'HUEVOS / 30' },
      { nombre: 'Rayado', costo: 5100, formula: 'MUZZA * 45 / 5000' },
      { nombre: 'Condimentos', costo: 100 }
    ]
  },
  {
    id: '7',
    nombre: 'Hamburguesa',
    ingredientes: [
      { nombre: 'Carne', costo: 0, formula: 'Preparación Hamburguesa' },
      { nombre: 'Pan Árabe', costo: 200 },
      { nombre: 'Mayo', costo: 5300, formula: 'MAYONESA / 20' },
      { nombre: 'Tomate', costo: 1500, formula: 'TOMATE / 10' },
      { nombre: 'Lechuga', costo: 150 },
      { nombre: 'Huevo', costo: 5000, formula: 'HUEVOS / 30' },
      { nombre: 'Jamón', costo: 3300, formula: 'JAMON / 20' },
      { nombre: 'Queso Barra', costo: 5100, formula: 'MUZZA / 20' },
      { nombre: 'Gas', costo: 150 },
      { nombre: 'Bolsa', costo: 50 },
      { nombre: 'Bandeja', costo: 80 }
    ]
  },
  {
    id: '8',
    nombre: 'Lomo',
    ingredientes: [
      { nombre: 'Carne', costo: 18000, formula: 'LOMO * 200 / 1000' },
      { nombre: 'Pan Árabe', costo: 200 },
      { nombre: 'Mayo', costo: 5300, formula: 'MAYONESA / 20' },
      { nombre: 'Tomate', costo: 1500, formula: 'TOMATE / 10' },
      { nombre: 'Lechuga', costo: 150 },
      { nombre: 'Huevo', costo: 5000, formula: 'HUEVOS / 30' },
      { nombre: 'Jamón', costo: 3300, formula: 'JAMON / 20' },
      { nombre: 'Queso Barra', costo: 5100, formula: 'MUZZA / 20' },
      { nombre: 'Gas', costo: 150 },
      { nombre: 'Bolsa', costo: 50 },
      { nombre: 'Bandeja', costo: 80 }
    ]
  },
  {
    id: '9',
    nombre: 'Pancho',
    ingredientes: [
      { nombre: 'Salchicha', costo: 800 },
      { nombre: 'Pan Pancho', costo: 150 },
      { nombre: 'Gas', costo: 100 },
      { nombre: 'Luz', costo: 50 },
      { nombre: 'Envoltorio', costo: 30 }
    ]
  }
];