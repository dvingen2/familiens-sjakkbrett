import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";

export function LoginPage() {
  const {
    isSupabaseMode,
    isLoading,
    profile,
    profiles,
    refreshProfiles,
    signInWithPassword,
    signUpWithPassword,
  } = useAppContext();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void refreshProfiles();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result =
      mode === "sign-in"
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, displayName);

    setIsSubmitting(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(
      mode === "sign-up"
        ? "Konto opprettet. Hvis e-postbekreftelse er slått på i Supabase, må brukeren bekrefte e-posten før innlogging."
        : "Innlogging fullført.",
    );
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <h1>Enkel innlogging</h1>
        <p>
          {isSupabaseMode
            ? "Supabase-modus er aktiv. Du kan registrere konto eller logge inn med e-post og passord."
            : "Lokal demo-modus er aktiv. Bruk en av profilene under, eller skriv inn en demo-epost for å bytte bruker."}
        </p>

        <div className="auth-toggle">
          <button
            type="button"
            className={`button ${mode === "sign-in" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("sign-in")}
          >
            Logg inn
          </button>
          <button
            type="button"
            className={`button ${mode === "sign-up" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("sign-up")}
          >
            Registrer
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "sign-up" ? (
            <label className="field">
              <span>Visningsnavn</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Familiemedlem"
                required
              />
            </label>
          ) : null}

          <label className="field">
            <span>E-post</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="navn@eksempel.no"
              required
            />
          </label>

          <label className="field">
            <span>Passord</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minst 6 tegn"
              required
            />
          </label>

          <button type="submit" className="button button-primary" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Jobber..." : mode === "sign-up" ? "Opprett konto" : "Logg inn"}
          </button>
        </form>

        {message ? <p className="info-text">{message}</p> : null}
        {profile ? <p className="info-text">Aktiv profil: {profile.displayName}</p> : null}

        <div className="login-list">
          {profiles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`login-user ${profile?.id === item.id ? "is-active" : ""}`}
              onClick={() => {
                if (!isSupabaseMode) {
                  void signInWithPassword(item.email, "demo");
                }
              }}
              disabled={isSupabaseMode}
            >
              <strong>{item.displayName}</strong>
              <span>{item.email}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Supabase-status</h2>
        <p>
          {isSupabaseMode
            ? "Miljøvariabler er tilgjengelige. Husk å legge inn redirect-URLer i Supabase før du bruker e-postbekreftelse i produksjon."
            : "Ingen Supabase-nøkler funnet ennå. Legg dem i en lokal .env-fil eller i GitHub Secrets senere."}
        </p>
      </section>
    </div>
  );
}
