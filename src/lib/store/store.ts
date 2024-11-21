import type { Nip07ExtensionSigner, Nip46RemoteSigner } from 'nostr-signer-connector';
import type { EventPacket, EventVerifier } from 'rx-nostr';
import { derived, get, readable, writable, type Readable, type Writable } from 'svelte/store';
import * as Nostr from 'nostr-tools';
import { SvelteMap } from 'svelte/reactivity';

export const signer: Writable<Nip07ExtensionSigner | Nip46RemoteSigner | undefined> = writable();

export const loading = writable<boolean>(false);
export const verifier = writable<EventVerifier>();

export const kind3Events = writable<SvelteMap<string, EventPacket>>(new SvelteMap()); // writable<Nostr.Event[]>([]);
export const kind0Events = writable<SvelteMap<string, EventPacket>>(new SvelteMap()); ///writable<Nostr.Event[]>([]);
export const kind1Events = writable<SvelteMap<string, EventPacket>>(new SvelteMap()); ///writable<Nostr.Event[]>([]);

export const dontCheckFollowState = writable<boolean>(false);
export const user = writable<string | undefined>();

export const followStateMap: Readable<Map<string, boolean>> = derived(
	[kind3Events, user],
	([$kind3Events, $user]) => {
		const map = new Map<string, boolean>(); // 普通の `Map`
		$kind3Events.forEach((ev) => {
			const isMutualFollow = ev.event.tags.some(
				(tag: string[]) => tag[0] === 'p' && tag[1] === $user
			);
			map.set(ev.event.pubkey, isMutualFollow);
		});
		return map; // ここでは普通の `Map` を返す
	}
);

export const multiple = writable<boolean>(false);

export const deleteList = writable<string[]>([]);
multiple.subscribe((value) => {
	if (!value) {
		deleteList.set([]);
	}
});

export let kind3Event = writable<Nostr.Event>();
