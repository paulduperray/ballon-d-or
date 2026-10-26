"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, CircleCheck, Crown, Eye, GripVertical, LockKeyhole, LogOut, Medal, Plus, Search, Sparkles, Trophy, X } from "lucide-react";
import { playerById, players, type Player } from "../lib/players";

type CommunityVote = { userId: string; voterName: string; ranking: string[]; lockedAt: string | null };
type Props = { user: { displayName: string; email: string } | null; signInPath: string; signOutPath: string; initialVote: { ranking: string[]; isFinal: boolean } | null; initialCommunity: CommunityVote[] };
const roles = ["Tous", "Attaquant", "Milieu", "Défenseur"] as const;
const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2);

function PlayerPortrait({ player, compact = false }: { player: Player; compact?: boolean }) {
  return <div className={`portrait ${compact ? "portrait--compact" : ""}`} style={{ "--accent": player.accent } as React.CSSProperties}>
    <span className="portrait__initials" aria-hidden="true">{initials(player.name)}</span>
    {player.image && <img src={player.image} alt={`Portrait de ${player.name}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
  </div>;
}

function Landing({ signInPath }: { signInPath: string }) {
  const featured = [playerById.get("dembele")!, playerById.get("yamal")!, playerById.get("mbappe")!, playerById.get("hakimi")!];
  return <main className="landing" id="contenu">
    <div className="landing__glow" aria-hidden="true" />
    <nav className="landing__nav" aria-label="Navigation principale"><a className="brand" href="#contenu"><span className="brand__mark"><Trophy size={18} /></span><span>LE CERCLE <b>D’OR</b></span></a><a className="button button--ghost" href={signInPath} target="_top">Se connecter <ArrowRight size={17} /></a></nav>
    <section className="landing__hero"><div className="eyebrow"><Sparkles size={14} /> Le vote entre passionnés</div><h1>Ton football.<br /><em>Ton Top 10.</em></h1><p>30 nommés, un seul classement. Compare les performances, fais tes choix et découvre le verdict de tes amis.</p><a className="button button--gold button--large" href={signInPath} target="_top">Composer mon Top 10 <ChevronRight size={19} /></a><div className="landing__proof"><span className="avatar-stack">{featured.slice(0, 3).map((p) => <span key={p.id}><PlayerPortrait player={p} compact /></span>)}</span><span><b>30 nommés</b><small>Une seule liste à défendre</small></span></div></section>
    <section className="landing__gallery" aria-label="Quelques joueurs nommés">{featured.map((player, index) => <article className={`hero-card hero-card--${index + 1}`} key={player.id} style={{ "--accent": player.accent } as React.CSSProperties}><PlayerPortrait player={player} /><div className="hero-card__rank">0{index + 1}</div><div className="hero-card__copy"><span>{player.flag} {player.country}</span><strong>{player.name}</strong><small>{player.club}</small></div></article>)}</section>
    <div className="landing__ticker" aria-hidden="true"><span>30 JOUEURS</span><i /><span>10 PLACES</span><i /><span>1 CLASSEMENT</span></div>
  </main>;
}

export default function BallonDorApp({ user, signInPath, signOutPath, initialVote, initialCommunity }: Props) {
  const [ranking, setRanking] = useState<string[]>(initialVote?.ranking ?? []);
  const [isFinal, setIsFinal] = useState(initialVote?.isFinal ?? false);
  const [community, setCommunity] = useState(initialCommunity);
  const [tab, setTab] = useState<"vote" | "community">(initialVote?.isFinal ? "community" : "vote");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("Tous");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => players.filter((player) => (role === "Tous" || player.role === role) && `${player.name} ${player.club} ${player.country}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr").trim())), [query, role]);
  if (!user) return <Landing signInPath={signInPath} />;

  const addPlayer = (id: string) => { if (isFinal || ranking.includes(id) || ranking.length >= 10) return; setRanking((current) => [...current, id]); setMessage(`${playerById.get(id)?.name} rejoint ton classement.`); };
  const removePlayer = (id: string) => { if (!isFinal) setRanking((current) => current.filter((item) => item !== id)); };
  const movePlayer = (index: number, delta: -1 | 1) => { if (isFinal || index + delta < 0 || index + delta >= ranking.length) return; setRanking((current) => { const next = [...current]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; }); };
  const saveFinal = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/votes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ranking, finalize: true }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Impossible d’enregistrer le vote.");
      const fresh = await fetch("/api/votes").then((result) => result.json()) as { community: CommunityVote[] };
      setCommunity(fresh.community); setIsFinal(true); setShowConfirm(false); setTab("community"); setMessage("Ton Top 10 est validé. Bienvenue dans les coulisses !");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Une erreur est survenue."); } finally { setBusy(false); }
  };

  return <div className="app-shell">
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <header className="app-header"><a className="brand" href="#contenu"><span className="brand__mark"><Trophy size={18} /></span><span>LE CERCLE <b>D’OR</b></span></a><nav className="app-tabs" aria-label="Sections"><button className={tab === "vote" ? "is-active" : ""} onClick={() => setTab("vote")}>Mon Top 10</button><button className={tab === "community" ? "is-active" : ""} onClick={() => isFinal && setTab("community")} disabled={!isFinal}>{!isFinal && <LockKeyhole size={14} />} Les votes</button></nav><div className="user-menu"><span className="user-avatar">{initials(user.displayName)}</span><span className="user-name">{user.displayName.split(" ")[0]}</span><a href={signOutPath} target="_top" aria-label="Se déconnecter"><LogOut size={18} /></a></div></header>
    {tab === "vote" ? <main id="contenu" className="vote-page">
      <section className="players-panel"><div className="section-heading"><div><span className="kicker">ÉDITION DES PASSIONNÉS</span><h1>Compose ton <em>Top 10</em></h1><p>Sélectionne dix joueurs, puis affine l’ordre dans ton bulletin.</p></div><div className="count-ring"><b>{ranking.length}</b><span>/10</span></div></div>
        <div className="filters"><label className="search-field"><Search size={17} /><span className="sr-only">Rechercher un joueur</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un joueur, un club…" /></label><div className="role-tabs" aria-label="Filtrer par poste">{roles.map((item) => <button key={item} className={role === item ? "is-active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div></div>
        <p className="season-note">Repères 2024/25 · toutes compétitions · statistiques indicatives</p>
        <div className="player-grid">{filtered.map((player) => { const selected = ranking.includes(player.id); return <article className={`player-card ${selected ? "is-selected" : ""}`} key={player.id} style={{ "--accent": player.accent } as React.CSSProperties}><button className="player-card__select" onClick={() => selected ? removePlayer(player.id) : addPlayer(player.id)} disabled={isFinal || (!selected && ranking.length >= 10)} aria-label={selected ? `Retirer ${player.name}` : `Ajouter ${player.name}`}><PlayerPortrait player={player} /><span className="select-badge">{selected ? <Check size={16} /> : <Plus size={16} />}</span></button><div className="player-card__body"><div className="player-card__meta"><span>{player.flag} {player.country}</span><span>{player.role}</span></div><h2>{player.name}</h2><p>{player.club}</p><div className="stats"><span><b>{player.goals}</b> buts</span><span><b>{player.assists}</b> passes dé.</span></div><div className="title-chip"><Trophy size={13} /><span>{player.titles[0]}</span>{player.titles.length > 1 && <b>+{player.titles.length - 1}</b>}</div></div></article>; })}</div>
      </section>
      <aside className="ballot-panel" aria-label="Ton classement"><div className="ballot-panel__top"><span className="kicker">TON BULLETIN</span><h2>{isFinal ? "Classement validé" : "La liste finale"}</h2><p>{isFinal ? "Ton vote est désormais verrouillé." : "Utilise les flèches pour classer tes favoris."}</p></div><div className="ballot-list">{Array.from({ length: 10 }, (_, index) => { const player = playerById.get(ranking[index]); return player ? <div className={`ballot-item ${index < 3 ? `ballot-item--${index + 1}` : ""}`} key={player.id}><span className="ballot-rank">{index + 1}</span><GripVertical size={15} className="grip" /><PlayerPortrait player={player} compact /><span className="ballot-name"><b>{player.name}</b><small>{player.club}</small></span>{!isFinal && <span className="ballot-actions"><button onClick={() => movePlayer(index, -1)} disabled={index === 0} aria-label={`Monter ${player.name}`}><ArrowUp size={14} /></button><button onClick={() => movePlayer(index, 1)} disabled={index === ranking.length - 1} aria-label={`Descendre ${player.name}`}><ArrowDown size={14} /></button><button onClick={() => removePlayer(player.id)} aria-label={`Retirer ${player.name}`}><X size={14} /></button></span>}</div> : <div className="ballot-empty" key={index}><span>{index + 1}</span><i /><small>Place disponible</small></div>; })}</div>{!isFinal && <button className="button button--gold ballot-submit" disabled={ranking.length !== 10} onClick={() => setShowConfirm(true)}>{ranking.length === 10 ? "Valider mon Top 10" : `Encore ${10 - ranking.length} joueur${10 - ranking.length > 1 ? "s" : ""}`}<ChevronRight size={18} /></button>}{isFinal && <button className="button button--gold ballot-submit" onClick={() => setTab("community")}>Voir les votes <Eye size={18} /></button>}<p className="ballot-lock"><LockKeyhole size={13} /> Après validation, ton vote sera définitif.</p></aside>
    </main> : <main id="contenu" className="community-page"><div className="community-hero"><button className="back-link" onClick={() => setTab("vote")}><ArrowLeft size={17} /> Mon classement</button><span className="kicker">LE VERDICT DU VESTIAIRE</span><h1>Les choix de la <em>communauté</em></h1><p>Compare les Top 10 — sans mauvaise foi, si possible.</p></div>{community.length === 0 ? <section className="empty-community"><span><Medal size={34} /></span><h2>Tu ouvres le bal</h2><p>Ton classement est validé. Invite maintenant les autres jurés pour découvrir leurs choix ici.</p></section> : <section className="community-grid">{community.map((vote) => <article className="vote-card" key={vote.userId}><div className="vote-card__header"><span className="user-avatar">{initials(vote.voterName)}</span><div><h2>{vote.voterName}</h2><p>Top 10 validé</p></div><CircleCheck size={20} /></div><ol>{vote.ranking.map((id, index) => { const player = playerById.get(id); return player ? <li key={id}><span className="rank-medal">{index === 0 ? <Crown size={17} /> : index + 1}</span><PlayerPortrait player={player} compact /><span><b>{player.name}</b><small>{player.club}</small></span></li> : null; })}</ol></article>)}</section>}</main>}
    <div className="live-message" aria-live="polite">{message}</div>
    {showConfirm && <div className="modal-backdrop" role="presentation" onMouseDown={() => !busy && setShowConfirm(false)}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowConfirm(false)} aria-label="Fermer"><X size={20} /></button><span className="modal-icon"><Trophy size={28} /></span><span className="kicker">DERNIER COUP D’ŒIL</span><h2 id="confirm-title">Prêt à défendre ce classement ?</h2><p>Une fois validé, ton Top 10 sera définitif et tu pourras découvrir ceux des autres.</p><ol className="confirm-podium">{ranking.slice(0, 3).map((id, index) => { const player = playerById.get(id)!; return <li key={id}><span>{index + 1}</span><PlayerPortrait player={player} compact /><b>{player.name}</b></li>; })}</ol><button className="button button--gold button--wide" onClick={saveFinal} disabled={busy}>{busy ? "Enregistrement…" : "Oui, valider mon Top 10"}<Check size={18} /></button><button className="text-button" onClick={() => setShowConfirm(false)} disabled={busy}>Je veux encore vérifier</button></section></div>}
  </div>;
}
