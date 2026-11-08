import { WorkspaceProvider } from "../features/workspace/WorkspaceProvider";
import { OverlayProvider } from "../shared/state/OverlayProvider";
import { GlobalOverlays } from "./GlobalOverlays";
import { WorkspaceLayout } from "./layout/WorkspaceLayout";
export default function App() {
  return (
    <OverlayProvider>
      <WorkspaceProvider>
        <WorkspaceLayout />
        <GlobalOverlays />
      </WorkspaceProvider>
    </OverlayProvider>
  );
}
