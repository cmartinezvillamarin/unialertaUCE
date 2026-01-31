import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Configuración para paginación server-side
 */
export interface ServerPaginationConfig<TData> {
  /** Nombre de la tabla en Supabase */
  tableName: string;
  /** Clave de query para React Query */
  queryKey: string;
  /** Columnas a seleccionar */
  selectColumns?: string;
  /** Función para transformar datos de la BD */
  transformData?: (data: unknown) => TData;
  /** Filtro por defecto (ej: { activo: true }) */
  defaultFilters?: Record<string, unknown>;
  /** Ordenamiento por defecto */
  orderBy?: { column: string; ascending?: boolean };
  /** Si la tabla tiene soft delete */
  hasSoftDelete?: boolean;
  /** Tamaño de página por defecto */
  defaultPageSize?: number;
  /** Deshabilitar cache en localStorage para listas grandes */
  disableLocalStorageCache?: boolean;
}

/**
 * Estado de paginación
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Resultado del hook con paginación server-side
 */
export interface ServerPaginationResult<TData> {
  /** Datos de la página actual */
  data: TData[];
  /** Estado de paginación */
  pagination: PaginationState;
  /** Estados de carga */
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  /** Navegación */
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  /** Refrescar datos */
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  /** Filtros dinámicos */
  setFilters: (filters: Record<string, unknown>) => void;
  currentFilters: Record<string, unknown>;
  /** Búsqueda */
  setSearch: (column: string, value: string) => void;
  clearSearch: () => void;
}

/**
 * Hook factory para crear hooks con paginación server-side
 * Soluciona el problema de cargar +1000 registros en memoria
 */
export function createServerPaginatedHook<TData extends Record<string, unknown>>(
  config: ServerPaginationConfig<TData>
) {
  const {
    tableName,
    queryKey,
    selectColumns = '*',
    transformData = (data) => data as TData,
    defaultFilters = {},
    orderBy = { column: 'created_at', ascending: false },
    hasSoftDelete = true,
    defaultPageSize = 25,
  } = config;

  return function useServerPagination(
    additionalFilters?: Record<string, unknown>
  ): ServerPaginationResult<TData> {
    const queryClient = useQueryClient();
    
    // Estado de paginación
    const [page, setPage] = useState(1);
    const [pageSize, setPageSizeState] = useState(defaultPageSize);
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, unknown>>({});
    const [searchFilter, setSearchFilter] = useState<{ column: string; value: string } | null>(null);
    
    // Combinar todos los filtros
    const allFilters = useMemo(() => ({
      ...defaultFilters,
      ...additionalFilters,
      ...dynamicFilters,
    }), [additionalFilters, dynamicFilters]);

    // Clave de query con paginación
    const paginatedQueryKey = useMemo(() => [
      queryKey,
      'paginated',
      { page, pageSize, filters: allFilters, search: searchFilter },
    ], [page, pageSize, allFilters, searchFilter]);

    // Query para contar total de registros
    const countQueryKey = useMemo(() => [
      queryKey,
      'count',
      { filters: allFilters, search: searchFilter },
    ], [allFilters, searchFilter]);

    // Obtener conteo total
    const { data: totalCount = 0 } = useQuery({
      queryKey: countQueryKey,
      queryFn: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        // Aplicar filtros
        Object.entries(allFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        // Filtrar soft-deleted
        if (hasSoftDelete && !('deleted_at' in allFilters)) {
          query = query.is('deleted_at', null);
        }

        // Aplicar búsqueda
        if (searchFilter && searchFilter.value) {
          query = query.ilike(searchFilter.column, `%${searchFilter.value}%`);
        }

        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
      staleTime: 30 * 1000, // 30 segundos
    });

    // Query principal con paginación
    const {
      data: pageData = [],
      isLoading,
      isFetching,
      isError,
      error,
      refetch: queryRefetch,
    } = useQuery({
      queryKey: paginatedQueryKey,
      queryFn: async () => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
          .from(tableName)
          .select(selectColumns)
          .range(from, to);

        // Aplicar filtros
        Object.entries(allFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        // Filtrar soft-deleted
        if (hasSoftDelete && !('deleted_at' in allFilters)) {
          query = query.is('deleted_at', null);
        }

        // Aplicar búsqueda
        if (searchFilter && searchFilter.value) {
          query = query.ilike(searchFilter.column, `%${searchFilter.value}%`);
        }

        // Ordenamiento
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(transformData);
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
      placeholderData: keepPreviousData,
    });

    // Calcular estado de paginación
    const pagination: PaginationState = useMemo(() => {
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      return {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }, [page, pageSize, totalCount]);

    // Funciones de navegación
    const goToPage = useCallback((newPage: number) => {
      const maxPage = Math.ceil(totalCount / pageSize) || 1;
      setPage(Math.max(1, Math.min(newPage, maxPage)));
    }, [totalCount, pageSize]);

    const nextPage = useCallback(() => {
      if (pagination.hasNextPage) {
        setPage((p) => p + 1);
      }
    }, [pagination.hasNextPage]);

    const previousPage = useCallback(() => {
      if (pagination.hasPreviousPage) {
        setPage((p) => p - 1);
      }
    }, [pagination.hasPreviousPage]);

    const setPageSize = useCallback((size: number) => {
      setPageSizeState(size);
      setPage(1); // Reset a primera página
    }, []);

    // Filtros dinámicos
    const setFilters = useCallback((filters: Record<string, unknown>) => {
      setDynamicFilters(filters);
      setPage(1); // Reset a primera página
    }, []);

    // Búsqueda
    const setSearch = useCallback((column: string, value: string) => {
      setSearchFilter(value ? { column, value } : null);
      setPage(1);
    }, []);

    const clearSearch = useCallback(() => {
      setSearchFilter(null);
      setPage(1);
    }, []);

    // Refrescar
    const refetch = useCallback(async () => {
      await queryRefetch();
    }, [queryRefetch]);

    const invalidate = useCallback(async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryKey, 'paginated'] }),
        queryClient.invalidateQueries({ queryKey: [queryKey, 'count'] }),
      ]);
    }, [queryClient]);

    return {
      data: pageData,
      pagination,
      isLoading,
      isFetching,
      isError,
      error: error as Error | null,
      goToPage,
      nextPage,
      previousPage,
      setPageSize,
      refetch,
      invalidate,
      setFilters,
      currentFilters: allFilters,
      setSearch,
      clearSearch,
    };
  };
}

/**
 * Hook genérico reutilizable para cualquier tabla
 */
export function useServerPagination<TData extends Record<string, unknown>>(
  config: ServerPaginationConfig<TData>,
  additionalFilters?: Record<string, unknown>
): ServerPaginationResult<TData> {
  const hook = useMemo(() => createServerPaginatedHook<TData>(config), [
    config.tableName,
    config.queryKey,
    config.selectColumns,
    config.defaultPageSize,
  ]);
  
  return hook(additionalFilters);
}
