import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Link2, Users, Wifi } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface OnlineLobbyProps {
  initialRoomCode?: string;
  onEnterGame: () => void;
  onBack: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ initialRoomCode = '', onEnterGame, onBack }) => {
  const [faction, setFaction] = useState<'FURIA' | 'ARCANO'>('FURIA');
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const initialJoinAttempted = useRef(false);
  const { createOnlineGame, joinOnlineGame, leaveOnlineGame, onlineSession, onlineError, isOnlineLoading } = useGameStore();

  const statusText = useMemo(() => {
    if (!onlineSession) return null;
    return onlineSession.status === 'active' ? 'Rival conectado' : 'Esperando a tu rival';
  }, [onlineSession]);

  useEffect(() => {
    if (!onlineSession || onlineSession.role !== 'host') return;
    const url = new URL(window.location.href);
    url.searchParams.set('sala', onlineSession.roomCode);
    setInviteLink(url.toString());
  }, [onlineSession]);

  useEffect(() => {
    const normalizedCode = initialRoomCode.trim().toUpperCase();
    if (initialJoinAttempted.current || onlineSession || normalizedCode.length !== 6) return;
    initialJoinAttempted.current = true;
    void joinOnlineGame(normalizedCode)
      .then(onEnterGame)
      .catch(() => undefined);
  }, [initialRoomCode, joinOnlineGame, onlineSession, onEnterGame]);

  const createRoom = async () => {
    try {
      const code = await createOnlineGame(faction, faction);
      const url = new URL(window.location.href);
      url.searchParams.set('sala', code);
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
      setInviteLink(url.toString());
    } catch {
      // The store exposes a useful localized error to render below the controls.
    }
  };

  const joinRoom = async () => {
    const normalizedCode = roomCode.trim().toUpperCase();
    if (!normalizedCode) return;
    try {
      await joinOnlineGame(normalizedCode);
      onEnterGame();
    } catch {
      // The store exposes a useful localized error to render below the controls.
    }
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const exitLobby = () => {
    void leaveOnlineGame();
    const url = new URL(window.location.href);
    url.searchParams.delete('sala');
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    onBack();
  };

  return (
    <main className="online-lobby">
      <section className="online-lobby-panel">
        <div className="online-lobby-heading">
          <span className="online-lobby-mark"><Wifi size={22} /></span>
          <div>
            <p>PARTIDA ENTRE AMIGOS</p>
            <h1>Duelo del Santuario</h1>
          </div>
        </div>

        {!onlineSession ? (
          <div className="online-lobby-grid">
            <section className="online-lobby-choice">
              <h2>Crear partida</h2>
              <p>Elige tu faccion. Tu rival recibira la faccion contraria al entrar.</p>
              <div className="online-faction-toggle" role="group" aria-label="Faccion del anfitrion">
                <button type="button" className={faction === 'FURIA' ? 'is-active furia' : ''} onClick={() => setFaction('FURIA')}>Furia</button>
                <button type="button" className={faction === 'ARCANO' ? 'is-active arcano' : ''} onClick={() => setFaction('ARCANO')}>Arcano</button>
              </div>
              <button type="button" className="online-primary-action" onClick={createRoom} disabled={isOnlineLoading}>
                <Users size={17} /> {isOnlineLoading ? 'Creando sala...' : 'Crear sala privada'}
              </button>
            </section>

            <section className="online-lobby-choice">
              <h2>Unirse a partida</h2>
              <p>Pega el codigo de seis caracteres o abre el enlace que te envio tu rival.</p>
              <label className="online-code-field">
                <span>Codigo de sala</span>
                <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
              </label>
              <button type="button" className="online-secondary-action" onClick={joinRoom} disabled={isOnlineLoading || roomCode.trim().length !== 6}>
                <Link2 size={17} /> {isOnlineLoading ? 'Conectando...' : 'Unirse al duelo'}
              </button>
            </section>
          </div>
        ) : (
          <section className="online-room-status">
            <div className={`online-presence ${onlineSession.status}`}><span />{statusText}</div>
            <p className="online-room-label">CODIGO DE SALA</p>
            <strong className="online-room-code">{onlineSession.roomCode}</strong>
            {onlineSession.role === 'host' && (
              <button type="button" className="online-copy-action" onClick={copyInvite}>
                <Copy size={16} /> {copied ? 'Enlace copiado' : 'Copiar enlace de invitacion'}
              </button>
            )}
            {onlineSession.status === 'active' ? (
              <button type="button" className="online-primary-action online-enter-action" onClick={onEnterGame}>
                Entrar a la partida
              </button>
            ) : (
              <p className="online-waiting-copy">Comparte el enlace. La partida se habilitara en cuanto se una tu rival.</p>
            )}
          </section>
        )}

        {onlineError && <p className="online-error" role="alert">{onlineError}</p>}
        <button type="button" className="online-back" onClick={exitLobby}>Volver al menu</button>
      </section>

      <style>{`
        .online-lobby { min-height: 100vh; width: 100vw; display: grid; place-items: center; padding: 32px; color: #eaf6ff; background: radial-gradient(ellipse at 50% 0%, #234b6c 0%, #0b1b2d 38%, #050a12 78%); }
        .online-lobby-panel { width: min(780px, 100%); padding: 30px; border: 1px solid rgba(166, 220, 241, 0.22); border-radius: 8px; background: rgba(5, 13, 23, 0.86); box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45); }
        .online-lobby-heading { display: flex; align-items: center; gap: 13px; padding-bottom: 22px; border-bottom: 1px solid rgba(195, 231, 246, 0.13); }
        .online-lobby-mark { width: 46px; height: 46px; display: grid; place-items: center; color: #c9f4ff; border: 1px solid rgba(105, 217, 255, 0.5); border-radius: 50%; background: rgba(50, 167, 217, 0.16); box-shadow: 0 0 20px rgba(72, 200, 247, 0.2); }
        .online-lobby-heading p, .online-room-label { margin: 0; color: #77cce7; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.1em; }
        .online-lobby-heading h1 { margin: 3px 0 0; font-size: 1.7rem; }
        .online-lobby-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 24px 0 10px; }
        .online-lobby-choice { display: flex; flex-direction: column; align-items: stretch; gap: 13px; min-height: 260px; padding: 20px; border: 1px solid rgba(171, 212, 231, 0.15); border-radius: 7px; background: rgba(255, 255, 255, 0.035); }
        .online-lobby-choice h2 { margin: 0; font-size: 1.05rem; }
        .online-lobby-choice p, .online-waiting-copy { margin: 0; color: #a8c0cb; font-size: 0.82rem; line-height: 1.45; }
        .online-faction-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .online-faction-toggle button, .online-primary-action, .online-secondary-action, .online-copy-action, .online-back { min-height: 40px; border-radius: 6px; font: inherit; font-size: 0.77rem; font-weight: 800; cursor: pointer; }
        .online-faction-toggle button { border: 1px solid rgba(180, 208, 221, 0.18); color: #90a8b3; background: rgba(7, 18, 29, 0.7); }
        .online-faction-toggle button.is-active.furia { border-color: rgba(255, 119, 101, 0.66); color: #ffd1c9; background: rgba(165, 53, 39, 0.3); }
        .online-faction-toggle button.is-active.arcano { border-color: rgba(100, 214, 255, 0.66); color: #d1f7ff; background: rgba(27, 104, 142, 0.34); }
        .online-primary-action, .online-secondary-action, .online-copy-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .online-primary-action { margin-top: auto; border: 1px solid rgba(117, 235, 195, 0.56); color: #effff8; background: #148d69; }
        .online-secondary-action { margin-top: auto; border: 1px solid rgba(105, 202, 242, 0.5); color: #e2f8ff; background: rgba(22, 99, 134, 0.72); }
        .online-primary-action:disabled, .online-secondary-action:disabled { cursor: wait; opacity: 0.56; }
        .online-code-field { display: grid; gap: 6px; color: #98b2be; font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .online-code-field input { width: 100%; border: 1px solid rgba(174, 222, 239, 0.26); border-radius: 5px; padding: 11px; color: #eaf9ff; background: rgba(2, 9, 16, 0.7); font: 800 1.1rem var(--font-display); letter-spacing: 0.18em; text-transform: uppercase; outline: none; }
        .online-code-field input:focus { border-color: #76d8fa; box-shadow: 0 0 0 3px rgba(72, 197, 236, 0.12); }
        .online-room-status { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 42px 0 19px; text-align: center; }
        .online-presence { display: inline-flex; align-items: center; gap: 7px; color: #d7e4e9; font-size: 0.78rem; font-weight: 700; }
        .online-presence span { width: 8px; height: 8px; border-radius: 50%; background: #d9a84d; box-shadow: 0 0 10px rgba(255, 199, 98, 0.7); }
        .online-presence.active span { background: #55e1aa; box-shadow: 0 0 10px rgba(85, 225, 170, 0.7); }
        .online-room-code { color: #effcff; font: 800 2.7rem var(--font-display); letter-spacing: 0.2em; }
        .online-copy-action { min-width: 220px; border: 1px solid rgba(119, 212, 246, 0.35); color: #cfefff; background: rgba(30, 98, 128, 0.38); }
        .online-enter-action { width: min(260px, 100%); margin-top: 8px; }
        .online-error { margin: 12px 0 0; padding: 10px; border-left: 3px solid #ff8174; color: #ffc3bc; background: rgba(148, 45, 35, 0.17); font-size: 0.78rem; }
        .online-back { display: block; margin: 17px auto 0; border: 0; color: #98b0bc; background: transparent; }
        .online-back:hover, .online-copy-action:hover { color: #ffffff; }
        @media (max-width: 680px) { .online-lobby { padding: 16px; } .online-lobby-panel { padding: 22px; } .online-lobby-grid { grid-template-columns: 1fr; } .online-lobby-choice { min-height: 0; } }
      `}</style>
    </main>
  );
};
