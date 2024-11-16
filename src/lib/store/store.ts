import type { Nip07ExtensionSigner, Nip46RemoteSigner } from 'nostr-signer-connector';
import type { EventVerifier } from 'rx-nostr';
import { writable, type Writable } from 'svelte/store';

export const signer: Writable<Nip07ExtensionSigner | Nip46RemoteSigner | undefined> = writable();

export const loading = writable<boolean>(false);
export const verifier = writable<EventVerifier>();
