import { useRecoilState } from 'recoil';
import { Waypoints } from 'lucide-react';
import store from '~/store/graph';
import { emitGraphEvent } from '~/hooks/Graph/useGraphEvents';

/** Drop next to your other header/nav icon buttons. */
export default function GraphToggleButton() {
  const [isOpen, setIsOpen] = useRecoilState(store.graphPanelOpen);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !isOpen;
        setIsOpen(next);
        emitGraphEvent(next ? 'graph:panel-opened' : 'graph:panel-closed', undefined);
      }}
      aria-pressed={isOpen}
      aria-label="Toggle graph view"
      title="Toggle graph view"
      className={`rounded-lg p-2 hover:bg-surface-hover ${isOpen ? 'bg-surface-active' : ''}`}
    >
      <Waypoints className="h-5 w-5" />
    </button>
  );
}
