import { useRef } from 'react';

type Listener = (payload: any) => void;

export default function useGraphIntegration() {
  const listeners = useRef<Record<string, Listener[]>>({});

  function on(event: string, cb: Listener) {
    listeners.current[event] = listeners.current[event] || [];
    listeners.current[event].push(cb);
    return () => {
      listeners.current[event] = (listeners.current[event] || []).filter((f) => f !== cb);
    };
  }

  function emit(event: string, payload: any) {
    (listeners.current[event] || []).forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.warn('graph integration listener error', err);
      }
    });
  }

  return { on, emit };
}
