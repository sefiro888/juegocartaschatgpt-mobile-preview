import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState } from '../types/card';
import { supabase } from './supabaseClient';
import type { OnlineMatchRecord } from './types';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join('');
}

function requireClient() {
  if (!supabase) throw new Error('Supabase no esta configurado.');
  return supabase;
}

export async function createOnlineMatch(hostId: string, gameState: GameState): Promise<OnlineMatchRecord> {
  const client = requireClient();
  const { data, error } = await client
    .from('online_matches')
    .insert({
      room_code: createRoomCode(),
      host_id: hostId,
      status: 'waiting',
      game_state: gameState,
      revision: 0,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la sala.');
  return data as OnlineMatchRecord;
}

export async function getOnlineMatch(roomCode: string): Promise<OnlineMatchRecord | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('online_matches')
    .select()
    .eq('room_code', roomCode.toUpperCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as OnlineMatchRecord | null;
}

export async function joinOnlineMatch(match: OnlineMatchRecord, guestId: string): Promise<OnlineMatchRecord> {
  const client = requireClient();
  if (match.guest_id && match.guest_id !== guestId) throw new Error('La sala ya tiene dos jugadores.');

  const { data, error } = await client
    .from('online_matches')
    .update({
      guest_id: guestId,
      status: 'active',
      revision: match.revision + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', match.id)
    .is('guest_id', null)
    .eq('revision', match.revision)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'La sala se acaba de ocupar.');
  return data as OnlineMatchRecord;
}

export async function saveOnlineMatchState(
  matchId: string,
  revision: number,
  gameState: GameState,
): Promise<OnlineMatchRecord> {
  const client = requireClient();
  const { data, error } = await client
    .from('online_matches')
    .update({ game_state: gameState, revision: revision + 1, updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .eq('revision', revision)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'La partida se actualizo en otro navegador.');
  return data as OnlineMatchRecord;
}

export function subscribeToOnlineMatch(
  matchId: string,
  onMatchChanged: (match: OnlineMatchRecord) => void,
): RealtimeChannel {
  const client = requireClient();
  return client
    .channel(`online-match:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'online_matches', filter: `id=eq.${matchId}` },
      ({ new: updatedMatch }) => onMatchChanged(updatedMatch as OnlineMatchRecord),
    )
    .subscribe();
}

export async function unsubscribeFromOnlineMatch(channel: RealtimeChannel | null): Promise<void> {
  if (channel && supabase) await supabase.removeChannel(channel);
}
