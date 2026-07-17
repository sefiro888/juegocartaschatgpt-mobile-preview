import { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, Users, Wifi } from 'lucide-react';
import { DECK_CATALOG, type DeckId } from '../core/deckCatalog';
import { useGameStore } from '../store/gameStore';

interface OnlineLobbyProps {
  initialRoomCode?: string;
  onEnterGame: () => void;
  onBack: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ initialRoomCode = '', onEnterGame, onBack }) => {
  const [deckId, setDeckId] = useState<DeckId>('FURIA');
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { createOnlineGame, joinOnlineGame, leaveOnlineGame, onlineSession, onlineError, isOnlineLoading } = useGameStore();
  const selectedDeck = useMemo(
    () => DECK_CATALOG.find((deck) => deck.id === deckId) ?? DECK_CATALOG[0],
    [deckId],
  );

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

  const createRoom = async () => {
    try {
      const code = await createOnlineGame(deckId);
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
      await joinOnlineGame(normalizedCode, deckId);
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
          <div className="online-lobby-setup">
            <section className={`online-deck-selector tone-${selectedDeck.tone}`}>
              <div className="online-deck-mark" aria-hidden="true">{selectedDeck.mark}</div>
              <label className="online-deck-field">
                <span>Tu mazo para este duelo</span>
                <select value={deckId} onChange={(event) => setDeckId(event.target.value as DeckId)}>
                  {DECK_CATALOG.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name} - {deck.faction} / {deck.archetype}
                    </option>
                  ))}
                </select>
              </label>
              <div className="online-deck-summary">
                <strong>{selectedDeck.name}</strong>
                <span>{selectedDeck.faction} / {selectedDeck.archetype}</span>
                <p>{selectedDeck.description}</p>
              </div>
            </section>

            <div className="online-lobby-grid">
              <section className="online-lobby-choice">
                <h2>Crear partida</h2>
                <p>Crea la sala con el mazo elegido. Tu rival podra escoger cualquiera de los otros mazos al entrar.</p>
                <button type="button" className="online-primary-action" onClick={createRoom} disabled={isOnlineLoading}>
                  <Users size={17} /> {isOnlineLoading ? 'Creando sala...' : 'Crear sala privada'}
                </button>
              </section>

              <section className="online-lobby-choice">
                <h2>Unirse a partida</h2>
                <p>Pega el codigo o abre el enlace, elige tu mazo y entra al duelo.</p>
                <label className="online-code-field">
                  <span>Codigo de sala</span>
                  <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
                </label>
                <button type="button" className="online-secondary-action" onClick={joinRoom} disabled={isOnlineLoading || roomCode.trim().length !== 6}>
                  <Link2 size={17} /> {isOnlineLoading ? 'Conectando...' : 'Unirse al duelo'}
                </button>
              </section>
            </div>
          </div>
        ) : (
          <section className="online-room-status">
            <div className={`online-presence ${onlineSession.status}`}><span />{statusText}</div>
            <p className="online-room-label">CODIGO DE SALA</p>
            <strong className="online-room-code">{onlineSession.roomCode}</strong>
            <div className={`online-room-deck tone-${selectedDeck.tone}`}>
              <span>{selectedDeck.mark}</span>
              <div><small>TU MAZO</small><strong>{selectedDeck.name}</strong></div>
            </div>
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
        .online-lobby { min-height: 100dvh; width: 100vw; display: grid; place-items: center; overflow-y: auto; padding: 32px; color: #eaf6ff; background: radial-gradient(ellipse at 50% 0%, #234b6c 0%, #0b1b2d 38%, #050a12 78%); }
        .online-lobby-panel { width: min(880px, 100%); padding: 30px; border: 1px solid rgba(166, 220, 241, 0.22); border-radius: 8px; background: rgba(5, 13, 23, 0.86); box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45); }
        .online-lobby-heading { display: flex; align-items: center; gap: 13px; padding-bottom: 22px; border-bottom: 1px solid rgba(195, 231, 246, 0.13); }
        .online-lobby-mark { width: 46px; height: 46px; display: grid; place-items: center; color: #c9f4ff; border: 1px solid rgba(105, 217, 255, 0.5); border-radius: 50%; background: rgba(50, 167, 217, 0.16); box-shadow: 0 0 20px rgba(72, 200, 247, 0.2); }
        .online-lobby-heading p, .online-room-label { margin: 0; color: #77cce7; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.1em; }
        .online-lobby-heading h1 { margin: 3px 0 0; font-size: 1.7rem; }
        .online-lobby-setup { display: grid; gap: 16px; padding-top: 20px; }
        .online-deck-selector { display: grid; grid-template-columns: 54px minmax(240px, 0.9fr) minmax(0, 1.1fr); align-items: center; gap: 16px; padding: 16px; border: 1px solid rgba(171, 212, 231, 0.17); border-radius: 7px; background: rgba(255, 255, 255, 0.04); }
        .online-deck-selector.tone-furia, .online-room-deck.tone-furia { border-color: rgba(255, 112, 89, 0.34); background: rgba(112, 35, 29, 0.15); }
        .online-deck-selector.tone-arcano, .online-room-deck.tone-arcano { border-color: rgba(88, 205, 249, 0.34); background: rgba(24, 82, 112, 0.18); }
        .online-deck-mark { width: 54px; height: 54px; display: grid; place-items: center; border: 1px solid rgba(185, 226, 242, 0.25); border-radius: 6px; color: #f2fbff; background: rgba(4, 14, 23, 0.72); font: 800 1.35rem var(--font-display); }
        .online-deck-field { display: grid; gap: 7px; color: #90b3c2; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
        .online-deck-field select { width: 100%; min-height: 46px; padding: 9px 36px 9px 11px; border: 1px solid rgba(174, 222, 239, 0.26); border-radius: 5px; color: #effbff; background: #0a1824; font: 700 0.82rem var(--font-sans); }
        .online-deck-summary { min-width: 0; }
        .online-deck-summary strong { display: block; color: #f3fbff; font: 800 1rem var(--font-display); }
        .online-deck-summary span { display: block; margin-top: 2px; color: #7ed9f5; font-size: 0.67rem; font-weight: 800; text-transform: uppercase; }
        .online-deck-summary p { margin: 7px 0 0; color: #a8c0cb; font-size: 0.76rem; line-height: 1.4; }
        .online-lobby-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 24px 0 10px; }
        .online-lobby-setup .online-lobby-grid { padding-top: 0; }
        .online-lobby-choice { display: flex; flex-direction: column; align-items: stretch; gap: 13px; min-height: 220px; padding: 20px; border: 1px solid rgba(171, 212, 231, 0.15); border-radius: 7px; background: rgba(255, 255, 255, 0.035); }
        .online-lobby-choice h2 { margin: 0; font-size: 1.05rem; }
        .online-lobby-choice p, .online-waiting-copy { margin: 0; color: #a8c0cb; font-size: 0.82rem; line-height: 1.45; }
        .online-primary-action, .online-secondary-action, .online-copy-action, .online-back { min-height: 40px; border-radius: 6px; font: inherit; font-size: 0.77rem; font-weight: 800; cursor: pointer; }
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
        .online-room-deck { display: flex; align-items: center; gap: 10px; min-width: 220px; padding: 9px 12px; border: 1px solid rgba(171, 212, 231, 0.18); border-radius: 6px; }
        .online-room-deck > span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 4px; background: rgba(3, 13, 21, 0.7); font-weight: 900; }
        .online-room-deck div { display: grid; text-align: left; }
        .online-room-deck small { color: #7da0af; font-size: 0.56rem; font-weight: 800; letter-spacing: 0.08em; }
        .online-room-deck strong { color: #f1fbff; font-size: 0.78rem; }
        .online-copy-action { min-width: 220px; border: 1px solid rgba(119, 212, 246, 0.35); color: #cfefff; background: rgba(30, 98, 128, 0.38); }
        .online-enter-action { width: min(260px, 100%); margin-top: 8px; }
        .online-error { margin: 12px 0 0; padding: 10px; border-left: 3px solid #ff8174; color: #ffc3bc; background: rgba(148, 45, 35, 0.17); font-size: 0.78rem; }
        .online-back { display: block; margin: 17px auto 0; border: 0; color: #98b0bc; background: transparent; }
        .online-back:hover, .online-copy-action:hover { color: #ffffff; }
        @media (max-width: 680px) {
          .online-lobby {
            place-items: start center;
            padding:
              calc(14px + env(safe-area-inset-top))
              max(12px, env(safe-area-inset-right))
              calc(18px + env(safe-area-inset-bottom))
              max(12px, env(safe-area-inset-left));
          }
          .online-lobby-panel {
            padding: 18px;
          }
          .online-lobby-heading {
            padding-bottom: 16px;
          }
          .online-lobby-mark {
            width: 42px;
            height: 42px;
          }
          .online-lobby-heading h1 {
            font-size: 1.4rem;
          }
          .online-lobby-grid {
            grid-template-columns: 1fr;
            padding-top: 16px;
          }
          .online-deck-selector {
            grid-template-columns: 44px minmax(0, 1fr);
            gap: 11px;
            padding: 13px;
          }
          .online-deck-mark {
            width: 44px;
            height: 44px;
          }
          .online-deck-summary {
            grid-column: 1 / -1;
          }
          .online-lobby-choice {
            min-height: 0;
            padding: 16px;
          }
          .online-primary-action,
          .online-secondary-action,
          .online-copy-action,
          .online-back {
            min-height: 48px;
          }
          .online-code-field input {
            min-height: 50px;
            font-size: 1rem;
          }
          .online-room-status {
            padding-block: 30px 14px;
          }
          .online-room-code {
            font-size: 2.15rem;
            letter-spacing: 0.14em;
          }
        }

        @media (max-height: 560px) and (orientation: landscape) {
          .online-lobby {
            place-items: start center;
          }
          .online-lobby-panel {
            width: min(900px, 100%);
          }
          .online-lobby-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
};
