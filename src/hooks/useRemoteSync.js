import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

/**
 * Generates a cryptographically secure 6-character case-sensitive PIN (e.g. k9F7p2).
 * Includes both uppercase and lowercase letters for strict case-sensitive pairing security.
 */
export function generatePin() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Case-sensitive (excludes ambiguous 0/O, 1/l/I)
  let result = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(6);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 6; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  // Math.random fallback
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getInitialControllerPin() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('pin') || '').trim();
}

export function isControllerMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'controller';
}

export function useRemoteSync({ appState, onRemoteAction }) {
  const isController = isControllerMode();
  const [pin, setPin] = useState(() => (isController ? getInitialControllerPin() : generatePin()));
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [peerError, setPeerError] = useState(null);
  const [syncedState, setSyncedState] = useState(null);
  const [connectedCount, setConnectedCount] = useState(0);

  const peerRef = useRef(null);
  const connRef = useRef(null); // For controller: connection to presenter
  const connectionsRef = useRef([]); // For presenter: list of active controller connections
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const onRemoteActionRef = useRef(onRemoteAction);
  onRemoteActionRef.current = onRemoteAction;

  // Broadcast state from presenter to all connected controllers
  const broadcastState = useCallback(
    (stateToBroadcast) => {
      if (isController) return;
      const payload = {
        type: 'STATE_SYNC',
        state: stateToBroadcast || appStateRef.current,
        timestamp: Date.now(),
      };
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(payload);
          } catch {
            // ignore closed connection errors
          }
        }
      });
    },
    [isController]
  );

  // Send a remote control command from controller to presenter
  const sendCommand = useCallback(
    (action, payload = null) => {
      if (!isController || !connRef.current || !connRef.current.open) return false;
      try {
        connRef.current.send({
          type: 'COMMAND',
          action,
          payload,
          timestamp: Date.now(),
        });
        return true;
      } catch {
        return false;
      }
    },
    [isController]
  );

  // Presenter Initialization
  const initPresenter = useCallback((currentPin) => {
    if (!currentPin) return;
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const presenterId = `pompompurin-presenter-${currentPin.trim().toLowerCase()}`;
    const peer = new Peer(presenterId, { debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      setPeerError(null);
    });

    peer.on('connection', (conn) => {
      connectionsRef.current.push(conn);
      setConnectedCount(connectionsRef.current.length);
      setIsConnected(true);

      conn.on('open', () => {
        // Send immediate state payload upon authorization
        conn.send({
          type: 'STATE_SYNC',
          state: appStateRef.current,
          timestamp: Date.now(),
        });
      });

      conn.on('data', (data) => {
        if (data?.type === 'COMMAND' && onRemoteActionRef.current) {
          onRemoteActionRef.current(data.action, data.payload);
        }
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter((c) => c !== conn);
        setConnectedCount(connectionsRef.current.length);
        if (connectionsRef.current.length === 0) {
          setIsConnected(false);
        }
      });

      conn.on('error', () => {
        connectionsRef.current = connectionsRef.current.filter((c) => c !== conn);
        setConnectedCount(connectionsRef.current.length);
        if (connectionsRef.current.length === 0) {
          setIsConnected(false);
        }
      });
    });

    peer.on('error', (err) => {
      setPeerError(err?.message || 'Presenter WebRTC registration error.');
    });
  }, []);

  // Controller Initialization
  const connectToPresenter = useCallback((targetPin) => {
    if (!targetPin) return;
    const cleanPin = targetPin.trim().toLowerCase();
    setIsConnecting(true);
    setPeerError(null);

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    const controllerId = `pompompurin-ctl-${cleanPin}-${Math.floor(Math.random() * 100000)}`;
    const peer = new Peer(controllerId, { debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      const presenterId = `pompompurin-presenter-${cleanPin}`;
      const conn = peer.connect(presenterId, { reliable: true });
      connRef.current = conn;

      const timeout = setTimeout(() => {
        if (!conn.open) {
          setIsConnecting(false);
          setIsConnected(false);
          setPeerError(`Could not find Presenter for PIN "${targetPin}". Make sure the Presenter Remote modal is open on Laptop A!`);
        }
      }, 7000);

      conn.on('open', () => {
        clearTimeout(timeout);
        setIsConnecting(false);
        setIsConnected(true);
        setPeerError(null);
      });

      conn.on('data', (data) => {
        if (data?.type === 'STATE_SYNC' && data.state) {
          setSyncedState(data.state);
        }
      });

      conn.on('close', () => {
        clearTimeout(timeout);
        setIsConnecting(false);
        setIsConnected(false);
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        setIsConnecting(false);
        setIsConnected(false);
        setPeerError(err?.message || 'Connection to presenter failed.');
      });
    });

    peer.on('error', (err) => {
      setIsConnecting(false);
      setIsConnected(false);
      setPeerError(err?.message || `Failed to connect to PIN "${targetPin}".`);
    });
  }, []);

  // Sync state changes from Presenter to active Controllers
  useEffect(() => {
    if (!isController && isConnected) {
      broadcastState(appState);
    }
  }, [appState, isConnected, isController, broadcastState]);

  // Setup PeerJS node on mount or PIN change
  useEffect(() => {
    if (isController) {
      if (pin) {
        connectToPresenter(pin);
      }
    } else {
      initPresenter(pin);
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [isController, pin, connectToPresenter, initPresenter]);

  const regeneratePin = useCallback(() => {
    const newPin = generatePin();
    setPin(newPin);
    if (!isController) {
      initPresenter(newPin);
    }
  }, [isController, initPresenter]);

  const disconnectAll = useCallback(() => {
    connectionsRef.current.forEach((conn) => {
      try {
        conn.close();
      } catch {
        // Ignore close errors
      }
    });
    connectionsRef.current = [];
    setConnectedCount(0);
    setIsConnected(false);
    regeneratePin();
  }, [regeneratePin]);

  return {
    isController,
    pin,
    setPin,
    regeneratePin,
    disconnectAll,
    isConnected,
    isConnecting,
    connectedCount,
    peerError,
    syncedState,
    sendCommand,
    connectToPresenter,
  };
}
