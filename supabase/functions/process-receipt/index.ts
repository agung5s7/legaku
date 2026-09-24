import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use the robust prompt as requested
const RECEIPT_PROMPT = `You are a receipt extraction engine for a family finance application in Indonesia.

Analyze the receipt image carefully.

Extract only information that is visually supported by the receipt.

Do not invent missing values.

If a field cannot be determined with reasonable confidence, return null.

Pay special attention to:
- merchant name
- transaction date
- transaction time
- line items
- quantities
- unit prices
- subtotal
- tax
- discount
- service charge
- total
- payment method if visible
- currency

Receipts may be Indonesian and may contain:
- Indonesian Rupiah
- abbreviated merchant names
- thermal printer text
- low contrast
- folded paper
- handwritten notes
- long receipts

For Indonesian currency:
- normalize monetary values into integer IDR amounts
- do not return currency symbols in numeric fields

Never fabricate an amount.

If total is unclear, return null and lower confidence.

If the image is not a receipt, indicate that clearly.

Do not make financial decisions.

Only extract information from the image.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { storagePath, familyId } = await req.json();

    if (!storagePath || !familyId) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate path against familyId
    if (!storagePath.startsWith(`${familyId}/`)) {
       return new Response(JSON.stringify({ error: "Invalid storage path for this family" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const geminiModel = Deno.env.get("GEMINI_RECEIPT_MODEL") || "gemini-3.6-flash";

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Create a Supabase client with the user's authorization token
    // This ensures RLS is applied when attempting to download the image and insert records.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log(`[process-receipt] Downloading image for ${storagePath}`);
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("receipts")
      .download(storagePath);

    if (downloadErr || !fileData) {
      console.error("[process-receipt] Error downloading receipt:", downloadErr);
      return new Response(JSON.stringify({ error: "Unauthorized or file not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = encodeBase64(arrayBuffer);

    // Determine correct image MIME type
    let mimeType = fileData.type;
    if (!mimeType || !mimeType.startsWith("image/")) {
      const lowerPath = storagePath.toLowerCase();
      if (lowerPath.endsWith(".png")) {
        mimeType = "image/png";
      } else if (lowerPath.endsWith(".webp")) {
        mimeType = "image/webp";
      } else {
        mimeType = "image/jpeg";
      }
    }

    console.log(`[process-receipt] Calling Gemini model: ${geminiModel} with MIME type ${mimeType}`);
    
    // Call Gemini API natively using REST
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
    
    const geminiRequestBody = {
      contents: [
        {
          parts: [
            { text: RECEIPT_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            is_receipt: { type: "BOOLEAN" },
            merchant_name: { type: "STRING", nullable: true },
            transaction_date: { type: "STRING", nullable: true },
            transaction_time: { type: "STRING", nullable: true },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  quantity: { type: "NUMBER", nullable: true },
                  unit_price: { type: "INTEGER", nullable: true },
                  total_price: { type: "INTEGER", nullable: true }
                },
                required: ["name"]
              }
            },
            subtotal: { type: "INTEGER", nullable: true },
            tax: { type: "INTEGER", nullable: true },
            discount: { type: "INTEGER", nullable: true },
            service_charge: { type: "INTEGER", nullable: true },
            total_amount: { type: "INTEGER", nullable: true },
            payment_method: { type: "STRING", nullable: true },
            currency: { type: "STRING", nullable: true },
            category_hint: { type: "STRING", nullable: true },
            overall_confidence: { type: "NUMBER" },
            warnings: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["is_receipt", "overall_confidence"]
        }
      }
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("[process-receipt] Gemini API failed:", errText);
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    
    const candidates = geminiData.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.length) {
      throw new Error("Invalid response from Gemini API");
    }

    const textResult = candidates[0].content.parts[0].text;
    const extracted = JSON.parse(textResult);

    if (!extracted.is_receipt) {
      return new Response(JSON.stringify({ error: "Gambar tidak dikenali sebagai struk belanja." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save record to receipts table using user-scoped client to enforce RLS
    const { error: insertErr } = await supabase.from("receipts").insert({
      family_id: familyId,
      storage_path: storagePath,
      processing_status: "ready",
      merchant_name: extracted.merchant_name,
      extracted_amount: extracted.total_amount,
      extracted_date: extracted.transaction_date,
      extracted_time: extracted.transaction_time,
      extracted_items: extracted.items,
      confidence: {
        overall: extracted.overall_confidence
      }
    });

    if (insertErr) {
      console.warn("[process-receipt] Warning: record insert to receipts table failed (non-blocking for UI response):", insertErr);
    }

    console.log(`[process-receipt] Successfully processed receipt for ${storagePath}`);

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[process-receipt] Internal error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Gagal memproses struk." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
