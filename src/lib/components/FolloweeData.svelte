<script lang="ts">
	import User from './User.svelte';
	import * as Nostr from 'nostr-tools';
	import { getRxEvents, getRxEventsAsStream } from '$lib/utils/rxnostr';
	import { writable } from 'svelte/store';
	import { loading } from '$lib/store/store';
	import { Button, Select } from 'svelte-5-ui-lib';
	import { now } from 'rx-nostr';
	interface SortType {
		value: string;
		name: string;
		href?: string;
	}

	// export let => Props
	let { followList, user }: { followList: string[]; user: string } = $props();

	// Events
	const kind3Events = writable<Nostr.Event[]>([]);
	const kind0Events = writable<Nostr.Event[]>([]);
	const kind1Events = writable<Nostr.Event[]>([]);
	const followStateMap = writable<Map<string, boolean>>(new Map());
	// $: -> $derived/$effect

	$effect(() => {
		if ($kind3Events) {
			$kind3Events.forEach((ev) => {
				const isMutualFollow = ev.tags.some((tag) => tag[0] === 'p' && tag[1] === user);
				followStateMap.update((map) => {
					const newMap = new Map(map);
					newMap.set(ev.pubkey, isMutualFollow);
					return newMap; // 必ず新しいMapを返す
				});
			});
		}
	});
	$effect(() => {
		if (followList.length === 0) {
			kind3Events.set([]);
			kind0Events.set([]);
			kind1Events.set([]);
			followStateMap.set(new Map());
			return;
		}
		$loading = true;
		// kind0 のフィルターを作成しイベントを取得
		const kind0Filters = followList.map((pub) => {
			return { authors: [pub], kinds: [0], until: now(), limit: 1 };
		});
		// kind3 のフィルターを作成しイベントを取得
		const kind3Filters = followList.map((pub) => {
			return { authors: [pub], kinds: [3], until: now(), limit: 1 };
		});

		const kind1Filters = followList.map((pub) => {
			return { authors: [pub], kinds: [1], until: now(), limit: 1 };
		});

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
				$loading = false;
			}
		});

		getRxEventsAsStream({ filters: kind3Filters }).subscribe({
			next: (event) => {
				//	console.log('Received event:', event);
				kind3Events.update((events) => event);
			},
			error: (err) => {
				console.error('Error:', err);
			},
			complete: () => {
				console.log('Event stream complete');
				$loading = false;
			}
		});

		// getRxEvents({ filters: kind1Filters })
		// 	.then((events) => {
		// 		kind1Events.set(events);
		// 	})
		// 	.finally(() => {
		// 		$loading = false;
		// 	});

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
				$loading = false;
			}
		});
	});

	//sort
	let sortedFollowList = $state<string[]>(followList);
	let sortSelected: string | undefined = $state();
	const sortType: SortType[] = [
		{ value: 'default', name: 'フォロー順' },
		{ value: 'note', name: '最終投稿順' },
		{ value: 'followStatus', name: '相互状態順' }
	];
	let ascending = $state(false);

	$effect(() => {
		console.log(sortSelected);
		switch (sortSelected) {
			case 'default':
				// デフォルト順序
				if (ascending) {
					sortedFollowList = followList.slice(); // 元の順序
				} else {
					sortedFollowList = followList.slice().reverse(); // 逆順
				}
				break;
			case 'note':
				// `created_at` に基づいて並べ替え
				if (ascending) {
					sortedFollowList = $kind1Events
						.slice()
						.sort((a, b) => a.created_at - b.created_at)
						.map((ev) => ev.pubkey);
				} else {
					sortedFollowList = $kind1Events
						.slice()
						.sort((a, b) => b.created_at - a.created_at)
						.map((ev) => ev.pubkey);
				}
				break;
			case 'followStatus':
				// フォロー状態に基づいて並べ替え
				sortedFollowList = followList.slice().sort((a, b) => {
					const aStatus = $followStateMap.get(a) ? 1 : 0;
					const bStatus = $followStateMap.get(b) ? 1 : 0;
					return ascending ? bStatus - aStatus : aStatus - bStatus;
				});
				break;
		}
	});
</script>

<div class="flex">
	<Select id="sort" class="mt-2" bind:value={sortSelected} placeholder="sort">
		{#each sortType as { value, name }}
			<option {value}>{name}</option>
		{/each}
	</Select><Button color="light" onclick={() => (ascending = !ascending)}
		>{ascending ? '▲' : '▼'}</Button
	>
</div>
{#if sortedFollowList}
	<ul class="w-full divide-y divide-primary-500 overflow-x-hidden">
		{#each sortedFollowList as pubkey}
			<li>
				<User
					{user}
					{pubkey}
					kind0={$kind0Events.find((ev) => ev.pubkey === pubkey)}
					isFollower={$followStateMap.get(pubkey)}
					kind1={$kind1Events.find((ev) => ev.pubkey === pubkey)}
				/>
			</li>
		{/each}
	</ul>{/if}
