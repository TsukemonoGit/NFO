import { kind3Relay } from '$lib/store/constants';
import {
	dontCheckFollowState,
	followStateMap,
	kind0Events,
	kind1Events,
	kind3Events,
	loading,
	verifier
} from '$lib/store/store';
import * as Nostr from 'nostr-tools';
import {
	chunk,
	createRxBackwardReq,
	createRxNostr,
	latest,
	latestEach,
	now,
	uniq,
	type EventPacket,
	type OkPacketAgainstEvent
} from 'rx-nostr';
import { verifier as cryptoVerifier } from 'rx-nostr-crypto';
import { get } from 'svelte/store';
import { Observable, scan, Subject, type OperatorFunction } from 'rxjs';
import { sortEventPackets } from './util';
import type { EventParameters } from 'nostr-typedef';

const rxNostr = createRxNostr({
	verifier: get(verifier) ?? cryptoVerifier,
	eoseTimeout: 10000
});

const flushes$ = new Subject<void>();

export function set10002DefaultRelay(ev: Nostr.Event) {
	const readRelays = ev.tags
		.filter((tag) => tag[0] === 'r' && (tag.length === 2 || tag[2] === 'read'))
		?.map((tag) => tag[1]);
	console.log(readRelays);
	rxNostr.setDefaultRelays([...(readRelays ?? []), ...kind3Relay]);
}
const filterLen = 100;
export async function getRxEvent({
	filters
}: {
	filters: Nostr.Filter[];
}): Promise<Nostr.Event | undefined> {
	flushes$.next();
	const rxReq = createRxBackwardReq();
	const chunkedReq = rxReq.pipe(
		chunk(
			(filters) => filters.length > filterLen,
			(filters) => {
				const pile = [...filters];
				const chunks = [];

				while (pile.length > 0) {
					chunks.push(pile.splice(0, filterLen));
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
		let packets: EventPacket[] = [];

		rxNostr
			.use(rxReq)
			.pipe(
				uniq(flushes$),
				latestEach(({ event }) => event.pubkey),
				scanArray()
			)
			.subscribe({
				next: (packet) => {
					packets = packet;
				},
				complete: () => {
					console.log('Completed!', packets);

					resolve(packets.map((pk) => pk.event));
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

export function getRxEventsAsStream({
	filters
}: {
	filters: Nostr.Filter[];
}): Observable<Nostr.Event[]> {
	return new Observable<Nostr.Event[]>((subscriber) => {
		const rxReq = createRxBackwardReq();
		const chunkedReq = rxReq.pipe(
			chunk(
				(filters) => filters.length > filterLen,
				(filters) => {
					const pile = [...filters];
					const chunks = [];

					while (pile.length > 0) {
						chunks.push(pile.splice(0, filterLen));
					}

					return chunks;
				}
			)
		);
		rxNostr
			.use(rxReq)
			.pipe(
				uniq(flushes$),
				latestEach(({ event }) => event.pubkey),
				scanArray()
			)
			.subscribe({
				next: (packets: EventPacket[]) => {
					subscriber.next(packets.map((pk) => pk.event));
				},
				error: (err) => subscriber.error(err),
				complete: () => subscriber.complete()
			});

		// Emit filters to initiate the request
		rxReq.emit(filters);
		rxReq.over();

		// Cleanup logic
		return () => {
			// rxReq.cancel(); // 必要ならキャンセル処理を追加
		};
	});
}

export function scanArray<A extends EventPacket>(): OperatorFunction<A, A[]> {
	return scan((acc: A[], a: A) => {
		const sorted = sortEventPackets([...acc, a]); //.sort((a, b) => b.event.created_at - a.event.created_at);

		return sorted;
	}, []);
}

export async function promisePublishSignedEvent(
	event: Nostr.Event,
	relays?: string[] | undefined
): Promise<{ event: Nostr.Event; res: OkPacketAgainstEvent[] }> {
	if (!relays && Object.entries(rxNostr.getDefaultRelays()).length === 0) {
		console.log('error');
		throw new Error('No default relays found.');
	}

	return new Promise<OkPacketAgainstEvent[]>((resolve) => {
		let results: OkPacketAgainstEvent[] = [];
		const timeoutId = setTimeout(() => {
			resolve(results);
		}, 3000);

		rxNostr.send(event, { relays: relays }).subscribe({
			next: (packet) => {
				console.log(`リレー ${packet.from} への送信が ${packet.ok ? '成功' : '失敗'} しました。`);
				results.push(packet);
			},
			complete: () => {
				clearTimeout(timeoutId);
				resolve(results);
			}
		});
	}).then((res) => ({ event, res }));
}

export const getUserEvents = async (followList: string[], user: string) => {
	// kind3 のフィルターを作成しイベントを取得
	const kind3Filters = followList
		.filter((pub) => get(kind3Events).find((ev) => ev.pubkey === pub) === undefined)
		.map((pub) => {
			return { authors: [pub], kinds: [3], until: now(), limit: 1 };
		});

	const kind1Filters = followList
		.filter((pub) => get(kind1Events).find((ev) => ev.pubkey === pub) === undefined)
		.map((pub) => {
			return { authors: [pub], kinds: [1], until: now(), limit: 1 };
		});

	if (!get(dontCheckFollowState)) {
		// kind0 のフィルターを作成しイベントを取得
		const kind0Filters = followList
			.filter((pub) => get(kind0Events).find((ev) => ev.pubkey === pub) === undefined) //既に持ってるデータを除く

			.map((pub) => {
				return { authors: [pub], kinds: [0], until: now(), limit: 1 };
			});

		if (kind0Filters.length > 0) {
			getRxEventsAsStream({ filters: kind0Filters }).subscribe({
				next: (event) => {
					//console.log('Received event:', event);
					kind0Events.update((events) => event);
				},
				error: (err) => {
					console.error('Error:', err);
				},
				complete: () => {
					console.log('Event stream complete');
					loading.set(false);
				}
			});
		}
	}
	if (kind3Filters.length > 0) {
		getRxEventsAsStream({ filters: kind3Filters }).subscribe({
			next: (event) => {
				//	console.log('Received event:', event);
				kind3Events.update((events) => event);

				get(kind3Events).forEach((ev) => {
					const isMutualFollow = ev.tags.some((tag) => tag[0] === 'p' && tag[1] === user);
					followStateMap.update((map) => {
						const newMap = new Map(map);
						newMap.set(ev.pubkey, isMutualFollow);
						return newMap; // 必ず新しいMapを返す
					});
				});
			},
			error: (err) => {
				console.error('Error:', err);
			},
			complete: () => {
				console.log('Event stream complete');
				loading.set(false);
			}
		});
	}

	// getRxEvents({ filters: kind1Filters })
	// 	.then((events) => {
	// 		kind1Events.set(events);
	// 	})
	// 	.finally(() => {
	// 		$loading = false;
	// 	});

	if (kind1Filters.length > 0) {
		getRxEventsAsStream({ filters: kind1Filters }).subscribe({
			next: (event: Nostr.Event[]) => {
				//console.log('Received event:', event);
				kind1Events.update((events) => event);
			},
			error: (err) => {
				console.error('Error:', err);
			},
			complete: () => {
				console.log('Event stream complete');
				loading.set(false);
			}
		});
	}
};
