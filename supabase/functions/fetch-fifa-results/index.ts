import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Football-data.org free tier — no API key needed for basic access
const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Missing server configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch World Cup 2026 competition matches from football-data.org
    // Competition ID for FIFA World Cup is 2000
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // If user has set a football-data API key, use it
    const footballDataKey = Deno.env.get("FOOTBALL_DATA_API_KEY");
    if (footballDataKey) {
      headers["X-Auth-Token"] = footballDataKey;
    }

    let updatedCount = 0;

    // Try football-data.org first
    try {
      const res = await fetch(
        `${FOOTBALL_DATA_BASE}/competitions/WC/matches?status=FINISHED`,
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        const matches = data.matches ?? [];

        // Get all our matches
        const { data: ourMatches } = await adminClient
          .from("matches")
          .select("id, match_number, home_team_id, away_team_id, status, external_id")
          .neq("status", "FINISHED");

        if (ourMatches && matches.length > 0) {
          // Get all teams for matching
          const { data: teams } = await adminClient
            .from("teams")
            .select("id, name, short_name, fifa_code, external_id");

          const teamMap = new Map<string, string>();
          teams?.forEach((t) => {
            if (t.name) teamMap.set(t.name.toLowerCase(), t.id);
            if (t.short_name) teamMap.set(t.short_name.toLowerCase(), t.id);
            if (t.fifa_code) teamMap.set(t.fifa_code.toLowerCase(), t.id);
          });

          for (const fm of matches) {
            const homeTeamName = fm.homeTeam?.name?.toLowerCase();
            const awayTeamName = fm.awayTeam?.name?.toLowerCase();
            const homeId = teamMap.get(homeTeamName ?? "");
            const awayId = teamMap.get(awayTeamName ?? "");

            if (!homeId || !awayId) continue;

            // Find matching match in our DB
            const ourMatch = ourMatches.find(
              (m) => m.home_team_id === homeId && m.away_team_id === awayId
            );

            if (!ourMatch) continue;

            // Use fullTime score (includes extra time but not penalties)
            const homeScore = fm.score?.fullTime?.home;
            const awayScore = fm.score?.fullTime?.away;

            if (homeScore == null || awayScore == null) continue;

            const { error } = await adminClient
              .from("matches")
              .update({
                official_home_score: homeScore,
                official_away_score: awayScore,
                status: "FINISHED",
                synced_at: new Date().toISOString(),
              })
              .eq("id", ourMatch.id);

            if (!error) updatedCount++;
          }
        }
      } else {
        console.error(
          "football-data.org returned",
          res.status,
          await res.text()
        );
      }
    } catch (apiErr) {
      console.error("Error fetching from football-data.org:", apiErr);
    }

    // After syncing, recalculate scores
    if (updatedCount > 0) {
      await adminClient.rpc("score_finished_matches");
      await adminClient.rpc("refresh_leaderboard");
    }

    return new Response(
      JSON.stringify({ success: true, updated: updatedCount }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Erro interno",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
