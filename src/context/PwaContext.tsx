import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextValue {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  installApp: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

function detectInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaProvider({ children }: PropsWithChildren) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => detectInstalled());

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onInstalled = () => setIsInstalled(true);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      isOnline,
      canInstall: Boolean(installPrompt) && !isInstalled,
      isInstalled,
      installApp: async () => {
        if (!installPrompt) {
          return false;
        }

        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        const accepted = choice.outcome === "accepted";
        if (accepted) {
          setIsInstalled(true);
        }
        setInstallPrompt(null);
        return accepted;
      },
    }),
    [installPrompt, isInstalled, isOnline],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwaContext() {
  const value = useContext(PwaContext);
  if (!value) {
    throw new Error("usePwaContext must be used inside PwaProvider");
  }
  return value;
}
