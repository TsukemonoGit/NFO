<script lang="ts">
	import User from './User.svelte';
	import * as Nostr from 'nostr-tools';
	import { getRxEvents } from '$lib/utils/rxnostr';
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
			$loading = true;
			$kind3Events.forEach((ev) => {
				const isMutualFollow = ev.tags.some((tag) => tag[0] === 'p' && tag[1] === user);
				followStateMap.update((map) => {
					map.set(ev.pubkey, isMutualFollow);
					return map; // Don't forget to return the updated map!
				});
			});
			$loading = false;
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
		// kind3 のフィルターを作成しイベントを取得
		const kind3Filters = followList.map((pub) => {
			return { authors: [pub], kinds: [3], until: now(), limit: 1 };
		});

		getRxEvents({ filters: kind3Filters })
			.then((events) => {
				kind3Events.set(events);
				// Follow status を更新
			})
			.finally(() => {
				$loading = false;
			});

		// kind0 のフィルターを作成しイベントを取得
		const kind0Filters = followList.map((pub) => {
			return { authors: [pub], kinds: [0], until: now(), limit: 1 };
		});

		//[{ authors: followList, kinds: [0] }];
		getRxEvents({ filters: kind0Filters })
			.then((events) => {
				kind0Events.set(events);
			})
			.finally(() => {
				$loading = false;
			});

		const kind1Filters = followList.map((pub) => {
			return { authors: [pub], kinds: [1], until: now(), limit: 1 };
		});
		getRxEvents({ filters: kind1Filters })
			.then((events) => {
				kind1Events.set(events);
			})
			.finally(() => {
				$loading = false;
			});
	});

	//sort
	let sortedFollowList = $state<string[]>(followList);
	let sortSelected: string | undefined = $state();
	const sortType: SortType[] = [
		{ value: 'default', name: 'フォロー順' },
		{ value: 'note', name: 'ノート順' },
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
	<ul class="divide-y divide-primary-500 overflow-x-hidden">
		{#each sortedFollowList as pubkey}
			{@const kind0 = $kind0Events.find((ev) => ev.pubkey === pubkey)}
			{@const kind1 = $kind1Events.find((ev) => ev.pubkey === pubkey)}
			<li class="my-1 whitespace-pre-wrap break-words" style="word-break: break-word;">
				<User {user} {pubkey} {kind0} isFollower={$followStateMap.get(pubkey)} {kind1} />
			</li>
		{/each}
	</ul>{/if}
