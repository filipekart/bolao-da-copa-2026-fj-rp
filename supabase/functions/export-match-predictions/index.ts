import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import ExcelJS from "npm:exceljs@4.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

function fmtBrasilia(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function sanitize(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}

async function exportMatch(admin: any, match: any): Promise<{ ok: boolean; error?: string; storage_path?: string; row_count?: number }> {
  const { data: preds, error: pErr } = await admin
    .from("match_predictions")
    .select("predicted_home_score, predicted_away_score, submitted_at, profiles!match_predictions_user_id_fkey(display_name)")
    .eq("match_id", match.id);
  if (pErr) return { ok: false, error: pErr.message };

  const rows = (preds ?? [])
    .map((r: any) => ({
      name: r.profiles?.display_name ?? "—",
      home: r.predicted_home_score,
      away: r.predicted_away_score,
      submitted: r.submitted_at,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Palpites");

  const matchLabel = `${match.home_team_name} x ${match.away_team_name}`;
  ws.addRow(["Jogo nº", match.match_number ?? "-"]);
  ws.addRow(["Partida", matchLabel]);
  ws.addRow(["Kickoff (Brasília)", fmtBrasilia(match.kickoff_at)]);
  ws.addRow(["Total de palpites", rows.length]);
  ws.addRow([]);

  const header = ws.addRow(["Usuário", "Palpite", "Horário do palpite (Brasília)"]);
  header.font = { bold: true };

  for (const r of rows) {
    ws.addRow([r.name, `${r.home} x ${r.away}`, fmtBrasilia(r.submitted)]);
  }
  ws.columns = [{ width: 32 }, { width: 14 }, { width: 28 }];

  const buf = await wb.xlsx.writeBuffer();
  const homeCode = sanitize(match.home_team_name).slice(0, 4) || "HOME";
  const awayCode = sanitize(match.away_team_name).slice(0, 4) || "AWAY";
  const matchNum = match.match_number ?? match.id.slice(0, 6);
  const path = `palpites-jogo-${matchNum}-${homeCode}-vs-${awayCode}.xlsx`;

  const { error: upErr } = await admin.storage
    .from("match-exports")
    .upload(path, new Uint8Array(buf), {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: logErr } = await admin
    .from("match_export_log")
    .upsert({
      match_id: match.id,
      storage_path: path,
      row_count: rows.length,
      exported_at: new Date().toISOString(),
    });
  if (logErr) return { ok: false, error: logErr.message };

  return { ok: true, storage_path: path, row_count: rows.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const forceMatchId: string | undefined = body?.match_id;

    // Auth rules:
    // - Auto-scan mode (no match_id): callable by cron without auth. It only
    //   exports predictions for matches that already kicked off and writes to
    //   a private bucket, so this is safe to leave open.
    // - Forced single-match mode (match_id provided): requires service-role
    //   token, valid cron secret, or an authenticated admin JWT.
    const cronHeader = req.headers.get("x-cron-secret") ?? "";
    const isCron = CRON_SECRET.length > 0 && cronHeader === CRON_SECRET;
    const authHeader = req.headers.get("Authorization") ?? "";
    const isServiceRole = authHeader === `Bearer ${SERVICE_KEY}`;
    if (forceMatchId && !isCron && !isServiceRole) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Não autenticado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Não autenticado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminCheck = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: roleRows } = await adminCheck
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");
      if (!roleRows || roleRows.length === 0) {
        return new Response(JSON.stringify({ error: "Apenas admins" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    let matchesToExport: any[] = [];
    if (forceMatchId) {
      const { data, error } = await admin
        .from("v_matches_with_teams")
        .select("id, match_number, kickoff_at, home_team_name, away_team_name")
        .eq("id", forceMatchId);
      if (error) throw error;
      matchesToExport = data ?? [];
    } else {
      const { data: done, error: dErr } = await admin
        .from("match_export_log")
        .select("match_id");
      if (dErr) throw dErr;
      const doneIds = (done ?? []).map((r: any) => r.match_id);

      let q = admin
        .from("v_matches_with_teams")
        .select("id, match_number, kickoff_at, home_team_name, away_team_name")
        .lte("kickoff_at", new Date().toISOString());
      if (doneIds.length) q = q.not("id", "in", `(${doneIds.join(",")})`);
      const { data, error } = await q;
      if (error) throw error;
      matchesToExport = data ?? [];
    }

    const results: any[] = [];
    for (const m of matchesToExport) {
      const r = await exportMatch(admin, m);
      results.push({ match_id: m.id, ...r });
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});