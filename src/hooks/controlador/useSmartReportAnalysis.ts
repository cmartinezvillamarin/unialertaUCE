import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];
type TipoReporte = Database['public']['Tables']['tipo_categories']['Row'];

export interface AnalysisResult {
  titulo: string;
  descripcion: string;
  categoriaKeywords: string[];
  tipoKeywords: string[];
  /** (Opcional) IDs seleccionados por la IA cuando están disponibles */
  categoriaId?: string;
  tipoReporteId?: string;
  prioridad: 'bajo' | 'medio' | 'alto' | 'urgente';
  infoAdicional: string;
}

export interface UseSmartReportAnalysisReturn {
  analyzeImage: (
    imageBase64: string,
    context?: string
  ) => Promise<AnalysisResult | null>;
  isAnalyzing: boolean;
  error: string | null;
}

/**
 * Hook para analizar imágenes de reportes con IA
 * Primero sube la imagen a Cloudinary y luego envía la URL para análisis
 */
export function useSmartReportAnalysis(): UseSmartReportAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = useCallback(async (
    imageBase64: string,
    context?: string
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Paso 1: Subir imagen via edge function para obtener una URL
      console.log('[SmartReportAnalysis] Uploading image via edge function...');
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('cloudinary-upload', {
        body: {
          file: imageBase64,
          folder: 'temp-analysis',
        },
      });
      
      if (uploadError || uploadData?.error) {
        throw new Error(uploadError?.message || uploadData?.error || 'Error al subir imagen para análisis');
      }
      
      const imageUrl = uploadData.secure_url;
      console.log('[SmartReportAnalysis] Image uploaded:', imageUrl);

      // Paso 2: Llamar a la edge function con la URL
      console.log('[SmartReportAnalysis] Calling analyze function...');
      const { data, error: fnError } = await supabase.functions.invoke('analyze-report-image', {
        body: {
          imageUrl, // Usar URL en lugar de base64
          context: context || '',
        },
      });

      if (fnError) {
        console.error('[SmartReportAnalysis] Edge function error:', fnError);
        throw new Error(fnError.message || 'Error analyzing image');
      }

      if (data?.error) {
        console.error('[SmartReportAnalysis] API error:', data.error);
        throw new Error(data.error);
      }

      console.log('[SmartReportAnalysis] Analysis complete:', data);
      return data as AnalysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar la imagen';
      setError(message);
      console.error('Error analyzing image:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeImage,
    isAnalyzing,
    error,
  };
}

/**
 * Encuentra la mejor coincidencia de categoría basada en keywords
 */
export function findBestCategoryMatch(
  keywords: string[],
  categories: Category[]
): Category | null {
  if (!keywords.length || !categories.length) return null;

  const lowerKeywords = keywords.map(k => k.toLowerCase());
  
  for (const category of categories) {
    const categoryName = category.nombre.toLowerCase();
    const categoryDesc = (category.descripcion || '').toLowerCase();
    
    for (const keyword of lowerKeywords) {
      if (categoryName.includes(keyword) || keyword.includes(categoryName) ||
          categoryDesc.includes(keyword)) {
        return category;
      }
    }
  }

  // Si no hay coincidencia exacta, buscar coincidencias parciales
  for (const category of categories) {
    const categoryName = category.nombre.toLowerCase();
    for (const keyword of lowerKeywords) {
      // Dividir en palabras y buscar coincidencias
      const keywordWords = keyword.split(/\s+/);
      const categoryWords = categoryName.split(/\s+/);
      
      for (const kw of keywordWords) {
        for (const cw of categoryWords) {
          if (kw.length > 2 && cw.length > 2 && (kw.includes(cw) || cw.includes(kw))) {
            return category;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Encuentra el mejor tipo de reporte basado en keywords y categoría
 */
export function findBestTipoMatch(
  keywords: string[],
  tipoReportes: TipoReporte[],
  categoryId?: string
): TipoReporte | null {
  if (!keywords.length || !tipoReportes.length) return null;

  const lowerKeywords = keywords.map(k => k.toLowerCase());
  
  // Filtrar por categoría si se proporciona
  const filteredTipos = categoryId 
    ? tipoReportes.filter(t => t.category_id === categoryId)
    : tipoReportes;

  for (const tipo of filteredTipos) {
    const tipoName = tipo.nombre.toLowerCase();
    const tipoDesc = (tipo.descripcion || '').toLowerCase();
    
    for (const keyword of lowerKeywords) {
      if (tipoName.includes(keyword) || keyword.includes(tipoName) ||
          tipoDesc.includes(keyword)) {
        return tipo;
      }
    }
  }

  // Coincidencias parciales
  for (const tipo of filteredTipos) {
    const tipoName = tipo.nombre.toLowerCase();
    for (const keyword of lowerKeywords) {
      const keywordWords = keyword.split(/\s+/);
      const tipoWords = tipoName.split(/\s+/);
      
      for (const kw of keywordWords) {
        for (const tw of tipoWords) {
          if (kw.length > 2 && tw.length > 2 && (kw.includes(tw) || tw.includes(kw))) {
            return tipo;
          }
        }
      }
    }
  }

  return null;
}
