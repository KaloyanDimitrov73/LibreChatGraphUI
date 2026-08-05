import { useEffect, useState } from 'react';
import { useRetrievalSettingsQuery, useUpdateRetrievalSettingsMutation } from '~/data-provider/Retrieval';

export default function RetrievalSettingsPanel() {
  const { data: settings, isLoading } = useRetrievalSettingsQuery();
  const updateSettings = useUpdateRetrievalSettingsMutation();

  const [topK, setTopK] = useState(8);
  const [threshold, setThreshold] = useState(0.75);
  const [corpus, setCorpus] = useState('');
  const [autoRetrieve, setAutoRetrieve] = useState(true);

  useEffect(() => {
    if (!settings) return;
    setTopK(settings.topK);
    setThreshold(settings.similarityThreshold);
    setCorpus(settings.corpus ?? '');
    setAutoRetrieve(settings.autoRetrieve);
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({ topK, similarityThreshold: threshold, corpus, autoRetrieve });
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-text-secondary">Loading retrieval settings…</div>;
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h3 className="text-sm font-semibold text-text-primary">Retrieval settings</h3>

      <label className="flex flex-col gap-1 text-sm text-text-primary">
        Results to retrieve (top K): {topK}
        <input type="range" min={1} max={50} value={topK}
          onChange={(e) => setTopK(Number(e.target.value))} className="w-full accent-blue-600" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-primary">
        Similarity threshold: {threshold.toFixed(2)}
        <input type="range" min={0} max={1} step={0.01} value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-blue-600" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-primary">
        Corpus / collection filter (optional)
        <input type="text" value={corpus} onChange={(e) => setCorpus(e.target.value)}
          placeholder="e.g. cs.AI, biomedical, all"
          className="rounded-md border border-border-medium bg-surface-primary px-2 py-1 text-sm text-text-primary" />
      </label>

      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" checked={autoRetrieve} onChange={(e) => setAutoRetrieve(e.target.checked)} />
        Automatically retrieve on every message
      </label>

      <button type="button" onClick={handleSave} disabled={updateSettings.isPending}
        className="mt-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
        {updateSettings.isPending ? 'Saving…' : 'Save settings'}
      </button>

      {updateSettings.isError && (
        <p className="text-sm text-red-500">Couldn&apos;t save settings. Please try again.</p>
      )}
    </div>
  );
}
