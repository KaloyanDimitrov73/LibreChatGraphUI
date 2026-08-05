import { atom } from 'recoil';

export const retrievalPanelOpen = atom<boolean>({
  key: 'retrievalPanelOpen',
  default: false,
});

export default { retrievalPanelOpen };
