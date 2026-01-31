import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Supabase JS agrega headers extra (p.ej. x-supabase-client-platform) que deben estar permitidos en CORS.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

type CategoryLite = { id: string; nombre: string };
type TipoLite = { id: string; nombre: string; category_id: string | null };

interface AnalysisResult {
  titulo: string;
  descripcion: string;
  categoriaKeywords: string[];
  tipoKeywords: string[];
  categoriaId?: string;
  tipoReporteId?: string;
  prioridad: 'bajo' | 'medio' | 'alto' | 'urgente';
  infoAdicional: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64, categories, tipoReportes, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Soportar tanto URL como base64
    const imageSource = imageUrl || imageBase64;
    if (!imageSource) {
      throw new Error("No image provided (need imageUrl or imageBase64)");
    }

    // Obtener categorías/tipos desde DB si no vienen en el body (evita problemas de carga en frontend)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    if (!supabaseKey) throw new Error("SUPABASE key is not configured");

    // Extraer token del header Authorization
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(SUPABASE_URL, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Use getUser instead of getClaims (more compatible)
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("auth.getUser error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    let effectiveCategories: CategoryLite[] = Array.isArray(categories) ? categories : [];
    let effectiveTipos: TipoLite[] = Array.isArray(tipoReportes) ? tipoReportes : [];

    if (effectiveCategories.length === 0) {
      const { data: cats, error: catsError } = await supabase
        .from("categories")
        .select("id,nombre")
        .eq("user_id", userId)
        .eq("activo", true)
        .is("deleted_at", null);

      if (catsError) {
        console.error("Error fetching categories:", catsError);
      }
      effectiveCategories = (cats || []) as CategoryLite[];
    }

    if (effectiveTipos.length === 0) {
      const categoryIds = effectiveCategories.map((c) => c.id);
      let query = supabase
        .from("tipo_categories")
        .select("id,nombre,category_id")
        .eq("activo", true)
        .is("deleted_at", null);

      if (categoryIds.length > 0) query = query.in("category_id", categoryIds);

      const { data: tipos, error: tiposError } = await query;
      if (tiposError) {
        console.error("Error fetching tipo_categories:", tiposError);
      }
      effectiveTipos = (tipos || []) as TipoLite[];
    }

    // Build context about available categories and types (include IDs so the model can return stable selections)
    const categoryList = (effectiveCategories || [])
      .map((c) => `${c.id}: ${c.nombre}`)
      .join("\n") || "Sin categorías";

    const tipoList = (effectiveTipos || [])
      .map((t) => `${t.id} (category_id=${t.category_id ?? 'null'}): ${t.nombre}`)
      .join("\n") || "Sin tipos";

     const systemPrompt = `Eres un asistente de análisis de imágenes para un sistema de reportes universitarios.
Tu tarea es analizar imágenes de incidentes, problemas o situaciones que requieren atención en un campus universitario.

 CATEGORÍAS DISPONIBLES (id: nombre):\n${categoryList}
 TIPOS DE REPORTE DISPONIBLES (id (category_id=...): nombre):\n${tipoList}

 CONTEXTO ACTUAL (si existe, úsalo para mantener coherencia sin repetir información):\n${typeof context === 'string' ? context : ''}

Analiza la imagen y proporciona:
1. Un título descriptivo y conciso (máximo 100 caracteres)
2. Una descripción detallada de lo que se observa (máximo 500 caracteres)
 3. Palabras clave que coincidan con las categorías disponibles
 4. Palabras clave que coincidan con los tipos de reporte disponibles
 5. Selección explícita de categoría y tipo, devolviendo IDs EXACTOS:
     - categoriaId: id de CATEGORÍAS DISPONIBLES (string). Si hay duda, elige la más cercana; evita "" salvo que sea imposible.
     - tipoReporteId: id de TIPOS DE REPORTE DISPONIBLES (string) que PERTENEZCA a la categoriaId elegida (mismo category_id). Si hay duda, elige el más cercano; evita "" salvo que sea imposible.
 6. La prioridad basada en la urgencia visual:
   - "urgente": Peligro inmediato, riesgo de vida, incendio, inundación activa, accidente
   - "alto": Daño significativo, obstrucción peligrosa, falla eléctrica visible
   - "medio": Deterioro notable, mantenimiento requerido, limpieza necesaria
   - "bajo": Observación menor, sugerencia de mejora
 7. Información adicional relevante sobre el contexto observado

Responde ÚNICAMENTE en formato JSON válido con esta estructura exacta:
{
  "titulo": "string",
  "descripcion": "string",
  "categoriaKeywords": ["string"],
  "tipoKeywords": ["string"],
   "categoriaId": "string",
   "tipoReporteId": "string",
  "prioridad": "bajo" | "medio" | "alto" | "urgente",
  "infoAdicional": "string"
}`;

    console.log("Calling AI gateway with image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza esta imagen y proporciona los datos para crear un reporte de incidente."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageSource
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log("AI response received");

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysisResult: AnalysisResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      analysisResult = JSON.parse(jsonMatch[0]);
      console.log("Analysis result parsed successfully");
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, "Content:", content);
      // Fallback response
      analysisResult = {
        titulo: "Reporte de incidente",
        descripcion: "Se detectó una situación que requiere atención.",
        categoriaKeywords: [],
        tipoKeywords: [],
        prioridad: "medio",
        infoAdicional: "Análisis automático no disponible. Por favor revise la imagen."
      };
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-report-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});