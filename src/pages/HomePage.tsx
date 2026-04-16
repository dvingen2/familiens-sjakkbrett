import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function HomePage() {
  const { isSupabaseMode, profile } = useAppContext();

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mobilvennlig familiesjakk</p>
          <h1>Et digitalt sjakkbrett for spill rundt kjøkkenbordet og på tvers av enheter.</h1>
          <p className="lead">
            Denne første versjonen er bygget som et GitHub Pages-vennlig skjelett. Den har
            responsivt brett, lokale demospill, oversikt over historikk og en struktur som er
            klar for Supabase-basert innlogging og online-spill.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/mine-spill">
              Åpne Mine spill
            </Link>
            <Link className="button button-secondary" to="/logg-inn">
              Se innlogging
            </Link>
          </div>
        </div>

        <aside className="info-card">
          <h2>Status nå</h2>
          <ul className="plain-list">
            <li>Responsivt touch-brett</li>
            <li>Trykk for å velge, hold inne for markering og dra</li>
            <li>{profile ? `Aktiv bruker: ${profile.displayName}` : "Ingen aktiv bruker ennå"}</li>
            <li>Klar for GitHub Pages med `HashRouter`</li>
            <li>{isSupabaseMode ? "Supabase er konfigurert" : "Lokal demo-modus er aktiv"}</li>
          </ul>
        </aside>
      </section>

      <section className="grid-two">
        <article className="card">
          <h2>Spillmoduser</h2>
          <p>
            Du kan starte både lokal pass-and-play og online-spill. I denne skissen lagres alt
            lokalt i nettleseren til du kobler på Supabase-tabeller og Auth.
          </p>
        </article>

        <article className="card">
          <h2>Neste steg</h2>
          <p>
            Legg inn `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY`, opprett tabellene, og bytt
            lagringslaget gradvis fra localStorage til database.
          </p>
        </article>
      </section>
    </div>
  );
}
