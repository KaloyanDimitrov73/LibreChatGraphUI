import { useRecoilValue } from 'recoil';
import { retrievalPanelOpen } from '~/store/retrieval';
import RetrievalSettingsPanel from './RetrievalSettingsPanel';

export { default as RetrievalSettingsButton } from './RetrievalSettingsButton';
export { default as RetrievalSettingsPanel } from './RetrievalSettingsPanel';

export default function RetrievalSidePanel() {
  const isOpen = useRecoilValue(retrievalPanelOpen);
  if (!isOpen) return null;
  return (
    <aside className="h-full w-80 shrink-0 border-l border-border-light bg-surface-primary">
      <RetrievalSettingsPanel />
    </aside>
  );
}
