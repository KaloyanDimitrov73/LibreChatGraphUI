import { useEffect, useRef } from 'react';
import type { GraphEventMap, GraphEventName } from '~/common/graph-types';

type Listener<K extends GraphEventName> = (payload: GraphEventMap[K]) => void;

class GraphEventBus {
  private target = new EventTarget();

  emit<K extends GraphEventName>(event: K, payload: GraphEventMap[K]) {
    this.target.dispatchEvent(new CustomEvent(event, { detail: payload }));
  }

  on<K extends GraphEventName>(event: K, listener: Listener<K>): () => void {
    const handler = (e: Event) => listener((e as CustomEvent<GraphEventMap[K]>).detail);
    this.target.addEventListener(event, handler);
    return () => this.target.removeEventListener(event, handler);
  }
}

/** Singleton bus shared between the Chat view and the Graph view. */
export const graphEventBus = new GraphEventBus();

export function emitGraphEvent<K extends GraphEventName>(event: K, payload: GraphEventMap[K]) {
  graphEventBus.emit(event, payload);
}

/**
 * Subscribe to a graph/chat interop event from any component, e.g. from the
 * chat side: useGraphEvent('graph:node-click', ({ node }) => {...})
 */
export function useGraphEvent<K extends GraphEventName>(event: K, listener: Listener<K>): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    return graphEventBus.on(event, (payload) => listenerRef.current(payload));
  }, [event]);
}
