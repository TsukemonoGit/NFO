import type { Nip07ExtensionSigner, Nip46RemoteSigner } from 'nostr-signer-connector';
import type { EventPacket, EventVerifier } from 'rx-nostr';
import { writable, type Writable } from 'svelte/store';
import * as Nostr from 'nostr-tools';

export const signer: Writable<Nip07ExtensionSigner | Nip46RemoteSigner | undefined> = writable();

export const loading = writable<boolean>(false);
export const verifier = writable<EventVerifier>();

export const kind3Events = writable<Map<string, EventPacket>>(new Map()); // writable<Nostr.Event[]>([]);
export const kind0Events = writable<Map<string, EventPacket>>(new Map()); ///writable<Nostr.Event[]>([]);
export const kind1Events = writable<Map<string, EventPacket>>(new Map()); ///writable<Nostr.Event[]>([]);
export const followStateMap = writable<Map<string, boolean>>(new Map());

export const dontCheckFollowState = writable<boolean>(false);
