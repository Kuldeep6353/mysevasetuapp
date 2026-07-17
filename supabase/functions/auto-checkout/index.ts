import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WORKDAY_END_HOUR = 17; // 5 PM
const WORKDAY_END_MINUTE = 30; // 5:30 PM

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isAfterWorkday = currentHour > WORKDAY_END_HOUR || (currentHour === WORKDAY_END_HOUR && currentMinute >= WORKDAY_END_MINUTE);

    if (!isAfterWorkday) {
      return new Response(JSON.stringify({ checkedOut: 0, reason: "before 5:30 PM" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const res = await fetch(`${supabaseUrl}/rest/v1/workers?status=eq.on_job`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "available" }),
    });

    const data = await res.json();
    const checkedOut = Array.isArray(data) ? data.length : 0;

    return new Response(JSON.stringify({ checkedOut, reason: "after 5:30 PM" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
