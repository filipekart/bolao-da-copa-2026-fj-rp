import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import ExcelJS from "npm:exceljs@4.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "daily-backups";
const RETENTION_DAYS = 30;

const TABLES = [
  "profiles",
  "user_roles",
  "managed_profiles",
  "teams",
  "players",
  "matches",
  "match_predictions",
  "extra_predictions",
  "knockout_predictions",
  "knockout_results",
  "leaderboard",
  "match_export_log",
];

async function fetchAll(admin: any, table: string): Promise<any[]> {
  const pageSize = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data, error } = await admin.from(table).select("*").range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function addSheet(wb: any, name: string, rows: any[]) {
  const ws = wb.addWorksheet(name.slice(0, 31));
  if (!rows.length) {
    ws.addRow(["(vazio)"]);
    return;
  }
  const cols = Object.keys(rows[0]);
  const header = ws.addRow(cols);
  header.font = { bold: true };
  for (const r of rows) {
    ws.addRow(cols.map((c) => {
      const v = r[c];
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return v;
    }));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const wb = new ExcelJS.Workbook();
    const summary: Record<string, number> = {};

    for (const t of TABLES) {
      const rows = await fetchAll(admin, t);
      addSheet(wb, t, rows);
      summary[t] = rows.length;
    }

    const buf = await wb.xlsx.writeBuffer();
    const path = `${today}/backup-${today}.xlsx`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, new Uint8Array(buf), {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });
    if (upErr) throw upErr;

    // Retenção: remove arquivos com prefixo de data < hoje - RETENTION_DAYS
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    const { data: folders } = await admin.storage.from(BUCKET).list("", { limit: 1000 });
    const toDelete: string[] = [];
    for (const f of folders ?? []) {
      if (!f.name) continue;
      // só pastas no formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(f.name) && f.name < cutoff) {
        const { data: inside } = await admin.storage.from(BUCKET).list(f.name, { limit: 1000 });
        for (const file of inside ?? []) {
          toDelete.push(`${f.name}/${file.name}`);
        }
      }
    }
    let deleted = 0;
    if (toDelete.length) {
      const { data: del } = await admin.storage.from(BUCKET).remove(toDelete);
      deleted = del?.length ?? 0;
    }

    return new Response(
      JSON.stringify({ ok: true, path, summary, deleted_files: deleted, cutoff }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});