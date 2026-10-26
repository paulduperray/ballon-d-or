begin;

select plan(6);

select lives_ok(
  $$select public.submit_ballot('Paul', array['bellingham','cubarsi','cucurella','dembele','diaz','fernandes','gabriel','haaland','hakimi','kane'])$$,
  'a valid top 10 is accepted'
);

select throws_ok(
  $$select public.submit_ballot('P', array['bellingham','cubarsi','cucurella','dembele','diaz','fernandes','gabriel','haaland','hakimi','kane'])$$,
  'P0001', 'Le prénom doit contenir entre 2 et 32 caractères.', 'short first name is rejected'
);

select throws_ok(
  $$select * from public.list_ballots('00000000-0000-0000-0000-000000000000')$$,
  'P0001', 'Valide d’abord ton Top 10 pour découvrir les autres votes.', 'results require a valid ballot token'
);

select throws_ok(
  $$select public.submit_ballot('Paul', array['bellingham'])$$,
  'P0001', 'Le classement doit contenir exactement 10 joueurs.', 'short ranking is rejected'
);

select throws_ok(
  $$select public.submit_ballot('Paul', array['bellingham','bellingham','cucurella','dembele','diaz','fernandes','gabriel','haaland','hakimi','kane'])$$,
  'P0001', 'Chaque joueur ne peut apparaître qu’une seule fois.', 'duplicate player is rejected'
);

select throws_ok(
  $$select public.submit_ballot('Paul', array['bellingham','cubarsi','cucurella','dembele','diaz','fernandes','gabriel','haaland','hakimi','inconnu'])$$,
  'P0001', 'Le classement contient un joueur inconnu.', 'unknown player is rejected'
);

select * from finish();
rollback;
