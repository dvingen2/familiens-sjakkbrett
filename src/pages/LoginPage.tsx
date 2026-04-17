import { useEffect, useState, type FormEvent } from "react";
import { useAppContext } from "../context/AppContext";
import { ProfileAvatar } from "../components/ProfileAvatar";

export function LoginPage() {
  const {
    isLoading,
    profile,
    profiles,
    refreshProfiles,
    registerWithUsernamePin,
    signInWithUsernamePin,
  } = useAppContext();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void refreshProfiles();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const normalizedUsername = username.trim().toLowerCase();
    const result =
      mode === "sign-in"
        ? await signInWithUsernamePin(normalizedUsername, pin)
        : await registerWithUsernamePin(normalizedUsername, pin);

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(
      mode === "sign-in"
        ? "Innlogging fullført."
        : "Brukeren er opprettet og klar til bruk.",
    );
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <h1>Enkel innlogging</h1>
        <p>
          Skriv inn brukernavn og en 6-sifret kode. Det er hele konto-oppsettet.
          Spillhistorikk, pågående partier og profiler lagres i skyen uten e-post eller passord.
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
            Opprett bruker
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Brukernavn</span>
            <input
              value={username}
              onChange={(event) => {
                const nextValue = event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9._-]/g, "")
                  .slice(0, 24);
                setUsername(nextValue);
              }}
              placeholder="for eksempel emma"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </label>

          <label className="field">
            <span>6-sifret kode</span>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              value={pin}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\D/g, "").slice(0, 6);
                setPin(nextValue);
              }}
              placeholder="123456"
              minLength={6}
              maxLength={6}
              required
            />
          </label>

          <button type="submit" className="button button-primary" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Jobber..." : mode === "sign-in" ? "Logg inn" : "Opprett bruker"}
          </button>
        </form>

        {message ? <p className="info-text">{message}</p> : null}
        {profile ? (
          <p className="info-text">
            Aktiv profil: {profile.displayName} (@{profile.username})
          </p>
        ) : null}

        <div className="login-list">
          {profiles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`login-user ${profile?.id === item.id ? "is-active" : ""}`}
              onClick={() => {
                setUsername(item.username);
                setMode("sign-in");
              }}
            >
              <span className="login-user-main">
                <ProfileAvatar profile={item} />
                <span className="login-user-copy">
                  <strong>{item.displayName}</strong>
                  <span>@{item.username}</span>
                </span>
              </span>
              <span className="login-user-meta">
                {profile?.id === item.id ? "Innlogget" : "Trykk for å fylle inn"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Lav terskel, ekte konto</h2>
        <p>
          Dette er nå hovedflyten i appen: ett brukernavn, én kode, og resten skjer i bakgrunnen.
          Hvis dere bare vil spille lokalt på samme enhet, kan dere fortsatt starte rett fra
          forsiden uten innlogging.
        </p>
      </section>
    </div>
  );
}
