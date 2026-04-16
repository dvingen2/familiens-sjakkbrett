# Familiens sjakkbrett

Et første skjelett for et mobilresponsivt, interaktivt sjakkbrett som kan hostes på GitHub Pages og senere kobles til Supabase for ekte brukerkontoer og online-spill.

## Innhold i denne første versjonen

- responsivt sjakkbrett bygget i React + TypeScript
- trykk for å velge brikke
- trykk-og-hold for å vise lovlige trekk før dra/slipp
- lokal demo-innlogging med eksempelbrukere
- "Mine spill" med motspillere og spilloversikt
- lokal lagring i `localStorage`
- klart skille mellom frontend og fremtidig Supabase-lag
- GitHub Pages-workflow via GitHub Actions

## Kom i gang

```bash
npm install
npm run dev
```

Bygg produksjonsversjon:

```bash
npm run build
```

## Supabase senere

Når du er klar til å koble på ekte backend:

1. Kopier `.env.example` til `.env`
2. Legg inn `VITE_SUPABASE_URL`
3. Legg inn `VITE_SUPABASE_ANON_KEY`
4. Kjør SQL-en i `supabase/schema.sql` i Supabase SQL Editor
5. Legg til redirect-URLer for localhost og GitHub Pages i Supabase Auth
6. Hold sikkerheten i databasen via Row Level Security

## Foreslått datamodell

- `profiles`
- `games`
- `moves`

Appen bruker nå:

- Supabase Auth for innlogging når miljøvariabler finnes
- Supabase-tabellene `profiles`, `games` og `moves`
- realtime-abonnement på `games` og `moves`
- lokal fallback hvis du åpner prosjektet uten Supabase

## Redirect-URLer i Supabase

Legg inn minst disse i Supabase Auth URL Configuration:

- `http://localhost:5173/`
- GitHub Pages-URLen din, for eksempel `https://brukernavn.github.io/reponavn/`
- eventuelle preview-adresser du vil støtte

Hvis e-postbekreftelse er slått på, er dette ekstra viktig.

## GitHub Pages

Repoet er satt opp med `HashRouter` og `base: "./"` for å være enkelt å publisere som prosjektside på GitHub Pages.

For å publisere:

1. push til `main`
2. aktiver GitHub Pages i repoets Settings
3. velg GitHub Actions som kilde
4. legg eventuelt inn Supabase-verdier som repo secrets
5. legg inn `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` som repo secrets hvis du vil deploye med backend aktiv

## Viktig avgrensning i denne demoen

Dette er nå et fungerende frontendskjelett med ekte Supabase-støtte, men du må fortsatt opprette Supabase-prosjektet, kjøre SQL-oppsettet og koble repoet til GitHub før produksjonsflyten er helt i mål.
