import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { votes } from "../db/schema";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import BallonDorApp from "./ballon-dor-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  if (!user) return <BallonDorApp user={null} signInPath={chatGPTSignInPath("/")} signOutPath="/" initialVote={null} initialCommunity={[]} />;
  const db = getDb();
  const [mine] = await db.select().from(votes).where(eq(votes.userId, user.userId)).limit(1);
  const community = mine?.isFinal
    ? await db.select({ userId: votes.userId, voterName: votes.voterName, ranking: votes.ranking, lockedAt: votes.lockedAt }).from(votes).where(eq(votes.isFinal, true)).orderBy(desc(votes.lockedAt)).limit(50)
    : [];
  return <BallonDorApp user={{ displayName: user.displayName, email: user.email }} signInPath={chatGPTSignInPath("/")} signOutPath={chatGPTSignOutPath("/")} initialVote={mine ? { ranking: mine.ranking, isFinal: mine.isFinal } : null} initialCommunity={community} />;
}
