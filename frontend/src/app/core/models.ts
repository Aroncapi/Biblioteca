export type Rol = 'ADMIN' | 'ALUMNO';
export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  rol: Rol;
}

export interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol?: Rol;
  nivel?: 'PRIMARIA' | 'SECUNDARIA' | null;
  grado?: number | null;
  seccion?: string | null;
}

export interface Libro {
  id?: number;
  nombre: string;
  categoria: string;
  codigoLibro: string;
  stockTotal: number;
  stockDisponible?: number;
}

export interface Prestamo {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  libroId: number;
  libroNombre: string;
  libroCodigo: string;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
  fechaDevolucionReal: string | null;
  estado: EstadoPrestamo;
  diasRestantes: number | null;
  diasRetraso: number | null;
}

export interface TopLibro {
  libroId: number;
  libroNombre: string;
  libroCodigo: string;
  categoria: string;
  totalPrestamos: number;
}

export interface DashboardStats {
  totalLibros: number;
  totalUsuarios: number;
  totalAlumnos: number;
  totalAdmins: number;
  prestamosActivos: number;
  prestamosVencidos: number;
  totalPrestamos: number;
  porcentajeActivos: number;
  porcentajeVencidos: number;
  topLibros: TopLibro[];
  ultimosPrestamos: Prestamo[];
}

export interface PrestamosPorMes {
  labels: string[];
  data: number[];
}

export type TipoReporte =
  | 'prestamos-activos'
  | 'prestamos-vencidos'
  | 'historial'
  | 'top-libros'
  | 'usuarios-activos'
  | 'estadisticas-categorias';

export type FormatoExport = 'pdf' | 'xlsx' | 'csv';
