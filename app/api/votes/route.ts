import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { votes } from "../../../db/schema";
import { players } from "../../../lib/players";

const validIds = new Set(players.map((player) => player.id));

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Connexion requise" }, { status: 401 });
  const db = getDb();
  const [mine] = await db.select().from(votes).where(eq(votes.userId, user.userId)).limit(1);
  const community = mine?.isFinal
    ? await db.select({ userId: votes.userId, voterName: votes.voterName, ranking: votes.ranking, lockedAt: votes.lockedAt }).from(votes).where(eq(votes.isFinal, true)).orderBy(desc(votes.lockedAt)).limit(50)
    : [];
  return Response.json({ mine: mine ?? null, community });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Connexion requise" }, { status: 401 });
  const body = (await request.json()) as { ranking?: unknown; finalize?: unknown };
  const ranking = Array.isArray(body.ranking) ? body.ranking.filter((id): id is string => typeof id === "string") : [];
  const finalize = body.finalize === true;
  if (ranking.length > 10 || new Set(ranking).size !== ranking.length || ranking.some((id) => !validIds.has(id))) return Response.json({ error: "Ce classement n’est pas valide." }, { status: 400 });
  if (finalize && ranking.length !== 10) return Response.json({ error: "Choisis exactement 10 joueurs avant de valider." }, { status: 400 });
  const db = getDb();
  const [existing] = await db.select().from(votes).where(eq(votes.userId, user.userId)).limit(1);
  if (existing?.isFinal) return Response.json({ error: "Ton vote est déjà validé et ne peut plus être modifié." }, { status: 409 });
  const now = new Date().toISOString();
  const values = { userId: user.userId, voterName: user.fullName || user.displayName.split("@")[0], voterEmail: user.email, ranking, isFinal: finalize, updatedAt: now, lockedAt: finalize ? now : null };
  const [saved] = await db.insert(votes).values(values).onConflictDoUpdate({ target: votes.userId, set: values }).returning();
  return Response.json({ vote: saved });
}
