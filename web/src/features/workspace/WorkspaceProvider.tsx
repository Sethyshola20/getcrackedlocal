import { LoaderCircle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../../shared/ui/Button";
import { Logo } from "../../shared/ui/Logo";
import { workspaceApi } from "./api";
import type { Bootstrap } from "./model";

type Workspace = { data: Bootstrap; refresh: () => Promise<void> };
const Context = createContext<Workspace | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("useWorkspace requires WorkspaceProvider");
  return value;
}
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Bootstrap | null>(null),
    [error, setError] = useState("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++revision.current;
    const result = await workspaceApi.load();
    if (request === revision.current) setData(result);
  }, []);
  useEffect(() => {
    let active = true;
    refresh().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
      revision.current++;
    };
  }, [refresh]);
  if (error)
    return (
      <div className="boot">
        <Logo />
        <h2>Couldn’t reach your workspace.</h2>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try again <RotateCcw size={16} />
        </Button>
      </div>
    );
  if (!data)
    return (
      <div className="boot">
        <Logo />
        <LoaderCircle className="spin" size={24} />
        <span>Opening your workspace</span>
      </div>
    );
  return (
    <Context.Provider value={{ data, refresh }}>{children}</Context.Provider>
  );
}
