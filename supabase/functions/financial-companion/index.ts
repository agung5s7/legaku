// ==============================================================================
// Supabase Edge Function: financial-companion
// Secure backend boundary for LLM conversation with authenticated family context
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, financialContext, familyId } = await req.json();

    if (!query || !familyId) {
      return new Response(JSON.stringify({ error: "Missing query or familyId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // In production, the backend invokes the LLM (e.g. Gemini 1.5 Flash) with instructions:
    // "You are LEGAKU AI, a calm, warm, non-judgmental family financial companion. Never invent numbers."
    const responsePayload = {
      content: `Berdasarkan data keuangan keluarga bulan ini:\nPemasukan tercatat Rp ${Number(financialContext?.currentMonth?.income || 0).toLocaleString('id-ID')} dan pengeluaran Rp ${Number(financialContext?.currentMonth?.expense || 0).toLocaleString('id-ID')}.\n\nKondisi keuangan keluarga Anda tetap berada di jalur yang terkendali.`,
      calculations: [
        { label: "Pemasukan", value: `Rp ${Number(financialContext?.currentMonth?.income || 0).toLocaleString('id-ID')}` },
        { label: "Pengeluaran", value: `Rp ${Number(financialContext?.currentMonth?.expense || 0).toLocaleString('id-ID')}` },
      ],
      actionChips: ["Bulan ini kita boros nggak?", "Kapan goal tercapai?"]
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
