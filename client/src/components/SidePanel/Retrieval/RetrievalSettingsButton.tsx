import { useRecoilState } from 'recoil';
import { retrievalPanelOpen } from '~/store/retrieval';

export default function RetrievalSettingsButton() {
  const [isOpen, setIsOpen] = useRecoilState(retrievalPanelOpen);
  return (
    <button type="button" aria-label="Toggle retrieval settings" aria-pressed={isOpen}
      onClick={() => setIsOpen((prev) => !prev)}
      className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-text-primary hover:bg-surface-hover">
      Retrieval settings
    </button>
  );
}
