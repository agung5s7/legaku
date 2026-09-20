// Supabase Edge Function: scheduled-daily-jobs
// Evaluates recurring transactions and queues daily smart notifications server-side.
// Can be triggered via Supabase Cron (pg_cron) or HTTP webhook.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Find all active recurring transactions due today or past due
    const { data: dueRecurring, error: recError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .lte('next_occurrence', todayStr);

    if (recError) throw recError;

    let queuedCount = 0;

    for (const item of dueRecurring || []) {
      // Check if notification already exists for this occurrence
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('family_id', item.family_id)
        .eq('type', 'recurring_due')
        .contains('data', { recurring_id: item.id })
        .gte('created_at', todayStr)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('notifications').insert({
          family_id: item.family_id,
          type: 'recurring_due',
          title: `Tagihan ${item.description} Jatuh Tempo`,
          message: `Tagihan ${item.description} (Rp ${item.amount.toLocaleString('id-ID')}) biasanya dibayar hari ini.`,
          data: { recurring_id: item.id, amount: item.amount, description: item.description },
          is_read: false,
          action_url: `/catat?recurring=${item.id}`,
        });
        queuedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: dueRecurring?.length || 0,
        notificationsQueued: queuedCount,
        executedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
