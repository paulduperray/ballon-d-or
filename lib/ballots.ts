export interface CommunityBallot {
  id: number;
  voterName: string;
  ranking: string[];
  createdAt: string;
}

type BallotRow = {
  id: number;
  voter_name: string;
  ranking: string[];
  created_at: string;
};

type SubmittedBallotRow = BallotRow & { access_token: string };
export type SubmittedBallot = CommunityBallot & { accessToken: string };

export type BallotErrorCode = "configuration" | "network" | "validation" | "server";

export type BallotResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: BallotErrorCode; message: string } };

function getSupabaseConfig(): BallotResult<{ url: string; key: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return { ok: false, error: { code: "configuration", message: "La base de votes n’est pas encore configurée." } };
  }
  return { ok: true, value: { url: url.replace(/\/$/, ""), key } };
}

function headers(key: string): HeadersInit {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function submitBallot(voterName: string, ranking: string[]): Promise<BallotResult<SubmittedBallot>> {
  const config = getSupabaseConfig();
  if (!config.ok) return config;
  try {
    const response = await fetch(`${config.value.url}/rest/v1/rpc/submit_ballot`, {
      method: "POST",
      headers: headers(config.value.key),
      body: JSON.stringify({ p_voter_name: voterName, p_ranking: ranking }),
    });
    if (!response.ok) {
      const payload = await response.json() as { message?: string };
      return { ok: false, error: { code: response.status === 400 ? "validation" : "server", message: payload.message || "Impossible d’enregistrer le vote." } };
    }
    const row = await response.json() as SubmittedBallotRow;
    return { ok: true, value: { ...mapBallot(row), accessToken: row.access_token } };
  } catch {
    return { ok: false, error: { code: "network", message: "La connexion à la base de votes a échoué." } };
  }
}

export async function listBallots(accessToken: string): Promise<BallotResult<CommunityBallot[]>> {
  const config = getSupabaseConfig();
  if (!config.ok) return config;
  try {
    const response = await fetch(`${config.value.url}/rest/v1/rpc/list_ballots`, { method: "POST", headers: headers(config.value.key), body: JSON.stringify({ p_access_token: accessToken }) });
    if (!response.ok) return { ok: false, error: { code: "server", message: "Impossible de charger les votes." } };
    const rows = await response.json() as BallotRow[];
    return { ok: true, value: rows.map(mapBallot) };
  } catch {
    return { ok: false, error: { code: "network", message: "La connexion à la base de votes a échoué." } };
  }
}

function mapBallot(row: BallotRow): CommunityBallot {
  return { id: row.id, voterName: row.voter_name, ranking: row.ranking, createdAt: row.created_at };
}
