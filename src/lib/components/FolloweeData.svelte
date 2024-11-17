<script lang="ts">
	import User from './User.svelte';

	import { getUserEvents } from '$lib/utils/rxnostr';

	import { followStateMap, kind0Events, kind1Events } from '$lib/store/store';
	import { Button, Select } from 'svelte-5-ui-lib';

	import { onMount } from 'svelte';
	interface SortType {
		value: string;
		name: string;
		href?: string;
	}

	// export let => Props
	let {
		followList,
		user,
		handleDelete
	}: { followList: string[]; user: string; handleDelete: (pubkey: string) => void } = $props();

	// Events

	// $: -> $derived/$effect

	onMount(() => {
		getUserEvents(followList, user);
	});

	//sort
	let sortedFollowList = $state<string[]>(followList);
	let sortSelected: string | undefined = $state();
	const sortType: SortType[] = [
		{ value: 'default', name: 'フォローリスト順' },
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
						.filter((ev) => followList.includes(ev.pubkey))
						.sort((a, b) => a.created_at - b.created_at)
						.map((ev) => ev.pubkey); //.filter((value)=>followList.includes(value));
				} else {
					sortedFollowList = $kind1Events
						.filter((ev) => followList.includes(ev.pubkey))
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

<div>
	フォロー人数： {followList.length} 相互:{followList.filter((pub) => $followStateMap.get(pub))
		.length} 片思い:{followList.filter((pub) => $followStateMap.get(pub) === false).length}
</div>
<div class="flex">
	<Select id="sort" bind:value={sortSelected} placeholder="sort">
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
					{handleDelete}
					{user}
					{pubkey}
					kind0={$kind0Events.find((ev) => ev.pubkey === pubkey)}
					isFollower={$followStateMap.get(pubkey)}
					kind1={$kind1Events.find((ev) => ev.pubkey === pubkey)}
				/>
			</li>
		{/each}
	</ul>{/if}
