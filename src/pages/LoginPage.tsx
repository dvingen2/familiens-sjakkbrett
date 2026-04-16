import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { ProfileAvatar } from "../components/ProfileAvatar";

export function LoginPage() {
  const {
    isSupabaseMode,
    isLoading,
    profile,
    profiles,
    refreshProfiles,
    registerFamilyProfile,
    signInFamilyProfile,
    signInWithPassword,
    signUpWithPassword,
  } = useAppContext();
  const [mode, setMode] = useState<"family-sign-in" | "family-sign-up" | "cloud-sign-in" | "cloud-sign-up">("family-sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
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
      mode === "family-sign-in"
        ? await signInFamilyProfile(displayName, pin)
        : mode === "family-sign-up"
          ? await registerFamilyProfile(displayName, pin)
          : mode === "cloud-sign-in"
            ? await signInWithPassword(email, password)
            : await signUpWithPassword(email, password, displayName);

    setIsSubmitting(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(
      mode === "family-sign-up"
        ? "Familieprofil opprettet og låst opp på denne enheten."
        : mode === "cloud-sign-up"
          ? "Skykonto opprettet. Hvis e-postbekreftelse er slått på i Supabase, må brukeren bekrefte e-posten før innlogging."
          : "Innlogging fullført.",
    );
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <h1>Enkel innlogging</h1>
        <p>
          Familieprofil med PIN er den raske standardflyten for deg og barna. Sky-innlogging er
          valgfri og trengs bare når dere vil synkronisere eller spille mellom enheter.
        </p>

        <div className="auth-toggle">
          <button
            type="button"
            className={`button ${mode === "family-sign-in" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("family-sign-in")}
          >
            Lås opp profil
          </button>
          <button
            type="button"
            className={`button ${mode === "family-sign-up" ? "button-primary" : "button-secondary"}`}
            onClick={() => setMode("family-sign-up")}
          >
            Ny familieprofil
          </button>
          {isSupabaseMode ? (
            <button
              type="button"
              className={`button ${mode === "cloud-sign-in" || mode === "cloud-sign-up" ? "button-primary" : "button-secondary"}`}
              onClick={() => setMode("cloud-sign-in")}
            >
              Sky-innlogging
            </button>
          ) : null}
        </div>

        {mode === "cloud-sign-in" || mode === "cloud-sign-up" ? (
          <div className="card tone-soft">
            <h2>Skykonto</h2>
            <p>
              Bruk dette bare når du vil lagre eller dele spill mellom enheter. For rask spilling
              hjemme holder det med familieprofil og PIN.
            </p>
            <div className="auth-toggle compact">
              <button
                type="button"
                className={`button ${mode === "cloud-sign-in" ? "button-primary" : "button-secondary"}`}
                onClick={() => setMode("cloud-sign-in")}
              >
                Logg inn
              </button>
              <button
                type="button"
                className={`button ${mode === "cloud-sign-up" ? "button-primary" : "button-secondary"}`}
                onClick={() => setMode("cloud-sign-up")}
              >
                Registrer
              </button>
            </div>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "family-sign-in" || mode === "family-sign-up" || mode === "cloud-sign-up" ? (
            <label className="field">
              <span>Brukernavn</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="For eksempel Emma"
                required
              />
            </label>
          ) : null}

          {mode === "family-sign-in" || mode === "family-sign-up" ? (
            <label className="field">
              <span>PIN-kode</span>
              <input
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                value={pin}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(nextValue);
                }}
                placeholder="4 til 6 sifre"
                minLength={4}
                maxLength={6}
                required
              />
            </label>
          ) : null}

          {mode === "cloud-sign-in" || mode === "cloud-sign-up" ? (
            <>
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
            </>
          ) : null}

          <button type="submit" className="button button-primary" disabled={isSubmitting || isLoading}>
            {isSubmitting
              ? "Jobber..."
              : mode === "family-sign-up"
                ? "Opprett familieprofil"
                : mode === "cloud-sign-up"
                  ? "Opprett skykonto"
                  : "Logg inn"}
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
                setDisplayName(item.displayName);
                setMode("family-sign-in");
              }}
            >
              <span className="login-user-main">
                <ProfileAvatar profile={item} />
                <span className="login-user-copy">
                  <strong>{item.displayName}</strong>
                  <span>{profile?.id === item.id ? "Aktiv på denne enheten" : "Trykk for å fylle inn"}</span>
                </span>
              </span>
              <span className="login-user-meta">{item.pin ? "PIN-profil" : "Profil"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Hva lagres hvor?</h2>
        <p>
          Lokalt spill kan starte uten innlogging og lagres i nettleseren. Skykonto er valgfri og
          brukes når dere ønsker lagring og spilling på tvers av enheter.
        </p>
      </section>
    </div>
  );
}
