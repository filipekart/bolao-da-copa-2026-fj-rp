import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

function computePositions<T extends Record<string, any>>(rows: T[], tieKeys: string[]): number[] {
  const positions: number[] = []
  rows.forEach((row, idx) => {
    if (idx === 0) { positions.push(1); return }
    const prev = rows[idx - 1]
    const tied = tieKeys.every(k => (row[k] ?? 0) === (prev[k] ?? 0))
    positions.push(tied ? positions[idx - 1] : idx + 1)
  })
  return positions
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')?.trim()
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: tk } = await supabase
      .from('public_ranking_tokens')
      .select('token')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle()

    if (!tk) {
      return new Response(JSON.stringify({ error: 'invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase.rpc('get_general_ranking')
    if (error) throw error

    const sorted = (data ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const p = (b.points_total ?? 0) - (a.points_total ?? 0)
        if (p !== 0) return p
        const e = (b.exact_hits ?? 0) - (a.exact_hits ?? 0)
        if (e !== 0) return e
        return (a.display_name ?? '').localeCompare(b.display_name ?? '', 'pt', { sensitivity: 'base' })
      })

    const positions = computePositions(sorted, ['points_total', 'exact_hits'])
    const result = sorted.map((r: any, i: number) => ({
      position: positions[i],
      name: r.display_name,
      points: r.points_total ?? 0,
    }))

    return new Response(JSON.stringify({ ranking: result, updated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})