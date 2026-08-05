import { atom } from 'recoil';
import type { AtomEffect } from 'recoil';

function localStorageEffect<T>(key: string): AtomEffect<T> {
  return ({ setSelf, onSet }) => {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const saved = localStorage.getItem(key);
    if (saved != null) {
      try {
        setSelf(JSON.parse(saved) as T);
      } catch {
        // ignore malformed persisted value
      }
    }
    onSet((newValue, _oldValue, isReset) => {
      if (isReset) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    });
  };
}

/** Open/closed state of the graph panel — persisted like the sidebar's visibility. */
export const graphPanelOpen = atom<boolean>({
  key: 'graphPanelOpen',
  default: false,
  effects: [localStorageEffect<boolean>('graphPanelOpen')],
});

/** Currently selected node id; drives the REST fetch for node detail. */
export const graphSelectedNodeId = atom<string | null>({
  key: 'graphSelectedNodeId',
  default: null,
});

export const graphPanelWidth = atom<number>({
  key: 'graphPanelWidth',
  default: 420,
  effects: [localStorageEffect<number>('graphPanelWidth')],
});

export default { graphPanelOpen, graphSelectedNodeId, graphPanelWidth };
