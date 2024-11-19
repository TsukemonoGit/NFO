import { verifier } from '$lib/store/store';
import * as Nostr from 'nostr-tools';
import { createRxBackwardReq, createRxNostr, latest, uniq } from 'rx-nostr';
import { verifier as cryptoVerifier } from 'rx-nostr-crypto';
import { get } from 'svelte/store';
import type { Profile } from '../../types/types';

export async function getEvent({
	filters,
	relays,
	timeout = 4000
}: {
	filters: Nostr.Filter[];
	relays: string[];
	timeout?: number;
}): Promise<Nostr.Event | undefined> {
	const rxNostr = createRxNostr({
		verifier: get(verifier) ?? cryptoVerifier,
		eoseTimeout: timeout
	});
	rxNostr.setDefaultRelays(relays);

	const rxReq = createRxBackwardReq();

	return new Promise((resolve, reject) => {
		let event: Nostr.Event | undefined;

		rxNostr
			.use(rxReq)
			.pipe(uniq(), latest())
			.subscribe({
				next: (packet) => {
					//console.log('Received:', packet);
					if (!event || packet.event.created_at > event.created_at) {
						event = packet.event;
					}
				},
				complete: () => {
					console.log('Completed!');
					resolve(event);
				},
				error: (e) => {
					console.error('Error:', e);
					reject(e);
				}
			});

		// Emit the filters and finish the request
		rxReq.emit(filters);
		rxReq.over();
	});
}

export const getProfile = (ev: Nostr.Event | undefined): Profile | undefined => {
	if (!ev) return undefined;
	try {
		return JSON.parse(ev.content);
	} catch {
		return undefined;
	}
};
