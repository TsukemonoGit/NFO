import { kind3Relay } from '$lib/store/constants';
import { verifier } from '$lib/store/store';
import * as Nostr from 'nostr-tools';
import { chunk, createRxBackwardReq, createRxNostr, latest, latestEach, uniq } from 'rx-nostr';
import { verifier as cryptoVerifier } from 'rx-nostr-crypto';
import { get } from 'svelte/store';
import { Subject } from 'rxjs';

const rxNostr = createRxNostr({
	verifier: get(verifier) ?? cryptoVerifier,
	eoseTimeout: 20000
});

const flushes$ = new Subject<void>();

export function set10002DefaultRelay(ev: Nostr.Event) {
	const readRelays = ev.tags.filter(
		(tag) => tag[0] === 'r' && (tag.length === 2 || tag[2] === 'read')
	)?.[1];

	rxNostr.setDefaultRelays([...(readRelays ?? []), ...kind3Relay]);
}

export async function getRxEvent({
	filters
}: {
	filters: Nostr.Filter[];
}): Promise<Nostr.Event | undefined> {
	flushes$.next();
	const rxReq = createRxBackwardReq();
	const chunkedReq = rxReq.pipe(
		chunk(
			(filters) => filters.length > 100,
			(filters) => {
				const pile = [...filters];
				const chunks = [];

				while (pile.length > 0) {
					chunks.push(pile.splice(0, 100));
				}

				return chunks;
			}
		)
	);
	return new Promise((resolve, reject) => {
		let event: Nostr.Event | undefined;

		rxNostr
			.use(chunkedReq)
			.pipe(uniq(flushes$), latest())
			.subscribe({
				next: (packet) => {
					console.log('Received:', packet);
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
export async function getRxEvents({
	filters
}: {
	filters: Nostr.Filter[];
}): Promise<Nostr.Event[]> {
	flushes$.next();
	const rxReq = createRxBackwardReq();

	return new Promise((resolve, reject) => {
		let events: Nostr.Event[] = [];

		rxNostr
			.use(rxReq)
			.pipe(
				uniq(flushes$),
				latestEach(({ event }) => event.pubkey)
			)
			.subscribe({
				next: (packet) => {
					console.log('Received:', packet);
					events.push(packet.event);
				},
				complete: () => {
					console.log('Completed!');
					resolve(events);
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
