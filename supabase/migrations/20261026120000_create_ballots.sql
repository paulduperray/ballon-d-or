create table public.ballots (
  id bigint generated always as identity primary key,
  voter_name varchar(32) not null,
  ranking text[] not null,
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint ballots_voter_name_length check (char_length(trim(voter_name)) between 2 and 32),
  constraint ballots_ranking_length check (cardinality(ranking) = 10)
);

create index ballots_created_at_idx on public.ballots (created_at desc);
create unique index ballots_access_token_idx on public.ballots (access_token);

alter table public.ballots enable row level security;

revoke all on table public.ballots from anon, authenticated;

create or replace function public.submit_ballot(
  p_voter_name text,
  p_ranking text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ballot public.ballots;
  v_allowed_players constant text[] := array[
    'bellingham','cubarsi','cucurella','dembele','diaz','fernandes','gabriel','haaland','hakimi','kane',
    'kvaratskhelia','yamal','mane','marquinhos','messi','lautaro','mbappe','mendes','neves','olise',
    'pacho','quinones','rodri','rice','ruiz','saliba','upamecano','vinicius','vitinha','torres'
  ];
begin
  if char_length(trim(p_voter_name)) not between 2 and 32 then
    raise exception 'Le prénom doit contenir entre 2 et 32 caractères.'
      using errcode = 'P0001', detail = '{"code":"invalid_voter_name"}';
  end if;

  if cardinality(p_ranking) <> 10 then
    raise exception 'Le classement doit contenir exactement 10 joueurs.'
      using errcode = 'P0001', detail = '{"code":"invalid_ranking_length"}';
  end if;

  if (select count(distinct player_id) from unnest(p_ranking) as player_id) <> 10 then
    raise exception 'Chaque joueur ne peut apparaître qu’une seule fois.'
      using errcode = 'P0001', detail = '{"code":"duplicate_player"}';
  end if;

  if exists (select 1 from unnest(p_ranking) as player_id where not (player_id = any(v_allowed_players))) then
    raise exception 'Le classement contient un joueur inconnu.'
      using errcode = 'P0001', detail = '{"code":"unknown_player"}';
  end if;

  insert into public.ballots (voter_name, ranking)
  values (trim(p_voter_name), p_ranking)
  returning * into v_ballot;

  return jsonb_build_object(
    'id', v_ballot.id,
    'voter_name', v_ballot.voter_name,
    'ranking', v_ballot.ranking,
    'created_at', v_ballot.created_at,
    'access_token', v_ballot.access_token
  );
end;
$$;

revoke all on function public.submit_ballot(text, text[]) from public;
grant execute on function public.submit_ballot(text, text[]) to anon, authenticated;

create or replace function public.list_ballots(p_access_token uuid)
returns table (
  id bigint,
  voter_name varchar(32),
  ranking text[],
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.ballots where access_token = p_access_token) then
    raise exception 'Valide d’abord ton Top 10 pour découvrir les autres votes.'
      using errcode = 'P0001', detail = '{"code":"ballot_required"}';
  end if;

  return query
    select b.id, b.voter_name, b.ranking, b.created_at
    from public.ballots b
    order by b.created_at desc
    limit 50;
end;
$$;

revoke all on function public.list_ballots(uuid) from public;
grant execute on function public.list_ballots(uuid) to anon, authenticated;
