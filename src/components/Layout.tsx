import { Link, NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { usePwaContext } from "../context/PwaContext";
import { ProfileAvatar } from "./ProfileAvatar";

export function Layout() {
  const { profile, signOutCurrentUser } = useAppContext();
  const { isOnline } = usePwaContext();

  return (
    <div className="shell">
      {!isOnline ? (
        <div className="offline-banner">
          Offline-modus er aktiv. Lokale spill virker fortsatt på denne enheten.
        </div>
      ) : null}

      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">♞</span>
          <span>
            <strong>Familiens sjakkbrett</strong>
            <small>Spill sammen på én eller flere enheter</small>
          </span>
        </Link>

        <nav className="nav">
          <NavLink to="/">Hjem</NavLink>
          <NavLink to="/laer">Lær</NavLink>
          <NavLink to="/mine-spill">Mine spill</NavLink>
          <NavLink to="/logg-inn">{profile ? "Profil" : "Logg inn"}</NavLink>
        </nav>

        <div className="topbar-user">
          {profile ? (
            <>
              <span className="signed-in-chip">
                <ProfileAvatar profile={profile} size="sm" />
                <span className="signed-in-as">Innlogget som @{profile.username}</span>
              </span>
              <button
                type="button"
                className="button button-secondary topbar-button"
                onClick={() => {
                  void signOutCurrentUser();
                }}
              >
                Logg ut
              </button>
            </>
          ) : (
            <span className="signed-in-as">Ikke logget inn</span>
          )}
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
