"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, CircleCheck, Crown, Eye, GripVertical, Medal, Plus, Search, Sparkles, Trophy, UserRound, X } from "lucide-react";
import { listBallots, submitBallot, type CommunityBallot } from "../lib/ballots";
import { playerById, players, type Player } from "../lib/players";

const roles = ["Tous", "Attaquant", "Milieu", "Défenseur"] as const;
type RoleFilter = (typeof roles)[number];

function initials(name: string): string {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function PlayerPortrait({ player, compact = false }: { player: Player; compact?: boolean }) {
  return <div className={`portrait ${compact ? "portrait--compact" : ""}`} style={{ "--accent": player.accent } as React.CSSProperties}>
    <span className="portrait__initials" aria-hidden="true">{initials(player.name)}</span>
    {player.image && <img src={player.image} alt={`Portrait de ${player.name}`} loading="lazy" width="330" height="440" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
  </div>;
}

function NameGate({ onContinue }: { onContinue: (name: string) => void }) {
  const [name, setName] = useState("");
  const cleanName = name.trim();
  const valid = cleanName.length >= 2 && cleanName.length <= 32;
  return <div className="name-gate"><div className="name-gate__glow" aria-hidden="true" /><section className="name-card" aria-labelledby="welcome-title"><span className="modal-icon"><Trophy size={28} /></span><span className="kicker">BIENVENUE DANS LE JURY</span><h1 id="welcome-title">Quel est ton prénom&nbsp;?</h1><p>Il apparaîtra avec ton Top 10 lorsque les autres jurés découvriront ton classement.</p><label><span>Ton prénom</span><div className="name-input"><UserRound size={18} /><input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} autoComplete="given-name" placeholder="Ex. Paul" autoFocus onKeyDown={(event) => { if (event.key === "Enter" && valid) onContinue(cleanName); }} /></div></label><button className="button button--gold button--wide" disabled={!valid} onClick={() => onContinue(cleanName)}>Entrer dans le jeu <ChevronRight size={18} /></button><small>Aucun compte à créer. Un prénom suffit.</small></section></div>;
}

function PlayerCard({ player, selected, disabled, onToggle }: { player: Player; selected: boolean; disabled: boolean; onToggle: (id: string) => void }) {
  return <article className={`player-card ${selected ? "is-selected" : ""}`} style={{ "--accent": player.accent } as React.CSSProperties}>
    <button className="player-card__select" onClick={() => onToggle(player.id)} disabled={disabled} aria-label={selected ? `Retirer ${player.name}` : `Ajouter ${player.name}`}><PlayerPortrait player={player} /><span className="select-badge">{selected ? <Check size={16} /> : <Plus size={16} />}</span></button>
    <div className="player-card__body"><div className="player-card__meta"><span>{player.flag} {player.country}</span><span>{player.role}</span></div><h2>{player.name}</h2><p>{player.club}</p><div className="stats"><span><b>{player.goals}</b> buts</span><span><b>{player.assists}</b> passes dé.</span></div><div className="titles-list" aria-label={`Titres de ${player.name}`}>{player.titles.map((title) => <span className="title-chip" key={title}><Trophy size={12} />{title}</span>)}</div></div>
  </article>;
}

function BallotPanel({ ranking, isFinal, onMove, onRemove, onConfirm, onCommunity }: { ranking: string[]; isFinal: boolean; onMove: (index: number, delta: -1 | 1) => void; onRemove: (id: string) => void; onConfirm: () => void; onCommunity: () => void }) {
  return <aside className="ballot-panel" aria-label="Ton classement"><div className="ballot-panel__top"><span className="kicker">TON BULLETIN</span><h2>{isFinal ? "Classement validé" : "La liste finale"}</h2><p>{isFinal ? "Ton vote est enregistré." : "Utilise les flèches pour classer tes favoris."}</p></div><div className="ballot-list">{Array.from({ length: 10 }, (_, index) => { const player = playerById.get(ranking[index]); return player ? <div className={`ballot-item ${index < 3 ? `ballot-item--${index + 1}` : ""}`} key={player.id}><span className="ballot-rank">{index + 1}</span><GripVertical size={15} className="grip" /><PlayerPortrait player={player} compact /><span className="ballot-name"><b>{player.name}</b><small>{player.club}</small></span>{!isFinal && <span className="ballot-actions"><button onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Monter ${player.name}`}><ArrowUp size={14} /></button><button onClick={() => onMove(index, 1)} disabled={index === ranking.length - 1} aria-label={`Descendre ${player.name}`}><ArrowDown size={14} /></button><button onClick={() => onRemove(player.id)} aria-label={`Retirer ${player.name}`}><X size={14} /></button></span>}</div> : <div className="ballot-empty" key={`empty-${index}`}><span>{index + 1}</span><i /><small>Place disponible</small></div>; })}</div>{!isFinal ? <button className="button button--gold ballot-submit" disabled={ranking.length !== 10} onClick={onConfirm}>{ranking.length === 10 ? "Valider mon Top 10" : `Encore ${10 - ranking.length} joueur${10 - ranking.length > 1 ? "s" : ""}`}<ChevronRight size={18} /></button> : <button className="button button--gold ballot-submit" onClick={onCommunity}>Voir les votes <Eye size={18} /></button>}<p className="ballot-lock">Après validation, tu découvriras les choix des autres.</p></aside>;
}

function CommunityPage({ ballots, onBack }: { ballots: CommunityBallot[]; onBack: () => void }) {
  return <main id="contenu" className="community-page"><div className="community-hero"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Mon classement</button><span className="kicker">LE VERDICT DU VESTIAIRE</span><h1>Les choix de la <em>communauté</em></h1><p>Compare les Top 10 — sans mauvaise foi, si possible.</p></div>{ballots.length === 0 ? <section className="empty-community"><span><Medal size={34} /></span><h2>Tu ouvres le bal</h2><p>Ton classement est validé. Partage maintenant le lien pour découvrir les choix de tes amis.</p></section> : <section className="community-grid">{ballots.map((ballot) => <article className="vote-card" key={ballot.id}><div className="vote-card__header"><span className="user-avatar">{initials(ballot.voterName)}</span><div><h2>{ballot.voterName}</h2><p>Top 10 validé</p></div><CircleCheck size={20} /></div><ol>{ballot.ranking.map((id, index) => { const player = playerById.get(id); return player ? <li key={id}><span className="rank-medal">{index === 0 ? <Crown size={17} /> : index + 1}</span><PlayerPortrait player={player} compact /><span><b>{player.name}</b><small>{player.club}</small></span></li> : null; })}</ol></article>)}</section>}</main>;
}

export default function BallonDorApp() {
  const [voterName, setVoterName] = useState<string | null>(null);
  const [ranking, setRanking] = useState<string[]>([]);
  const [isFinal, setIsFinal] = useState(false);
  const [community, setCommunity] = useState<CommunityBallot[]>([]);
  const [tab, setTab] = useState<"vote" | "community">("vote");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("Tous");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => players.filter((player) => (role === "Tous" || player.role === role) && `${player.name} ${player.club} ${player.country}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr").trim())), [query, role]);

  if (!voterName) return <NameGate onContinue={setVoterName} />;

  const togglePlayer = (id: string) => { if (isFinal) return; setRanking((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 10 ? [...current, id] : current); };
  const movePlayer = (index: number, delta: -1 | 1) => { if (index + delta < 0 || index + delta >= ranking.length) return; setRanking((current) => { const next = [...current]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; }); };
  const saveFinal = async () => {
    setBusy(true); setMessage("");
    const saved = await submitBallot(voterName, ranking);
    if (!saved.ok) { setMessage(saved.error.message); setBusy(false); return; }
    const loaded = await listBallots(saved.value.accessToken);
    if (!loaded.ok) { setMessage(loaded.error.message); setBusy(false); return; }
    setCommunity(loaded.value); setIsFinal(true); setShowConfirm(false); setTab("community"); setBusy(false); setMessage("Ton Top 10 est validé !");
  };

  return <div className="app-shell"><a className="skip-link" href="#contenu">Aller au contenu</a><header className="app-header"><a className="brand" href="#contenu"><span className="brand__mark"><Trophy size={18} /></span><span>LE CERCLE <b>D’OR</b></span></a><nav className="app-tabs" aria-label="Sections"><button className={tab === "vote" ? "is-active" : ""} onClick={() => setTab("vote")}>Mon Top 10</button><button className={tab === "community" ? "is-active" : ""} onClick={() => isFinal && setTab("community")} disabled={!isFinal}>Les votes</button></nav><div className="user-menu"><span className="user-avatar">{initials(voterName)}</span><span className="user-name">{voterName}</span></div></header>
    {tab === "vote" ? <main id="contenu" className="vote-page"><section className="players-panel"><div className="section-heading"><div><span className="kicker">ÉDITION DES PASSIONNÉS</span><h1>Compose ton <em>Top 10</em></h1><p>Sélectionne dix joueurs, puis affine l’ordre dans ton bulletin.</p></div><div className="count-ring"><b>{ranking.length}</b><span>/10</span></div></div><div className="filters"><label className="search-field"><Search size={17} /><span className="sr-only">Rechercher un joueur</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un joueur, un club…" /></label><div className="role-tabs" aria-label="Filtrer par poste">{roles.map((item) => <button key={item} className={role === item ? "is-active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div></div><p className="season-note">Repères 2024/25 · toutes compétitions · statistiques indicatives</p><div className="player-grid">{filtered.map((player) => <PlayerCard key={player.id} player={player} selected={ranking.includes(player.id)} disabled={isFinal || (!ranking.includes(player.id) && ranking.length >= 10)} onToggle={togglePlayer} />)}</div></section><BallotPanel ranking={ranking} isFinal={isFinal} onMove={movePlayer} onRemove={togglePlayer} onConfirm={() => setShowConfirm(true)} onCommunity={() => setTab("community")} /></main> : <CommunityPage ballots={community} onBack={() => setTab("vote")} />}
    <div className="live-message" aria-live="polite">{message}</div>{showConfirm && <div className="modal-backdrop" role="presentation" onMouseDown={() => !busy && setShowConfirm(false)}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowConfirm(false)} aria-label="Fermer"><X size={20} /></button><span className="modal-icon"><Trophy size={28} /></span><span className="kicker">DERNIER COUP D’ŒIL</span><h2 id="confirm-title">Prêt à défendre ce classement, {voterName}&nbsp;?</h2><p>Une fois validé, ton Top 10 sera enregistré et tu découvriras ceux des autres.</p><ol className="confirm-podium">{ranking.slice(0, 3).map((id, index) => { const player = playerById.get(id)!; return <li key={id}><span>{index + 1}</span><PlayerPortrait player={player} compact /><b>{player.name}</b></li>; })}</ol><button className="button button--gold button--wide" onClick={saveFinal} disabled={busy}>{busy ? "Enregistrement…" : "Oui, valider mon Top 10"}<Check size={18} /></button><button className="text-button" onClick={() => setShowConfirm(false)} disabled={busy}>Je veux encore vérifier</button></section></div>}
  </div>;
}
