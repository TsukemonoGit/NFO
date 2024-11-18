<script lang="ts">
	import User from './User.svelte';

	import { getUserEvents } from '$lib/utils/rxnostr';

	import { dontCheckFollowState, followStateMap, kind0Events, kind1Events } from '$lib/store/store';
	import { Button, Select } from 'svelte-5-ui-lib';

	import { onMount } from 'svelte';
	import { CaretUpSolid, CaretDownSolid } from 'flowbite-svelte-icons';
	import { _ } from 'svelte-i18n';

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
	let sortSelected: string | undefined = $state('default');
	const sortType: SortType[] = [
		{ value: 'default', name: $_('sortType.default') },
		{ value: 'note', name: $_('sortType.note') }
	];
	if (!$dontCheckFollowState) {
		sortType.push({ value: 'followStatus', name: $_('sortType.followStatus') });
	}
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
					sortedFollowList = Array.from($kind1Events.values())
						.filter((ev) => followList.includes(ev.event.pubkey))
						.sort((a, b) => a.event.created_at - b.event.created_at)
						.map((ev) => ev.event.pubkey); //.filter((value)=>followList.includes(value));
				} else {
					sortedFollowList = Array.from($kind1Events.values())
						.filter((ev) => followList.includes(ev.event.pubkey))
						.sort((a, b) => b.event.created_at - a.event.created_at)
						.map((ev) => ev.event.pubkey);
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

<div class="mt-4 rounded-md border border-secondary-500 p-2">
	<div class="flex items-center justify-between">
		<div>
			<span class="font-bold">{$_('followCount')}</span>:
			{followList.length}
			{#if !$dontCheckFollowState}<span class="ml-2 font-bold">{$_('mutualFollow')}🫂</span>: {followList.filter(
					(pub) => $followStateMap.get(pub)
				).length}
				<span class="ml-2 font-bold">{$_('UnilateralFollow')}😐</span>: {followList.filter(
					(pub) => $followStateMap.get(pub) === false
				).length}<span class="ml-2 font-bold">{$_('unknown')}❔️</span>: {followList.filter(
					(pub) => $followStateMap.get(pub) === undefined
				).length}{/if}
		</div>
		<div class="flex gap-1">
			<Select id="sort" bind:value={sortSelected} placeholder="sort">
				{#each sortType as { value, name }}
					<option {value}>{name}</option>
				{/each}
			</Select><Button pill color="light" class="w-[42px]" onclick={() => (ascending = !ascending)}
				>{#if ascending}<CaretUpSolid />
				{:else}
					<CaretDownSolid />{/if}</Button
			>
		</div>
	</div>
	{#if sortedFollowList}
		<ul class="w-full divide-y divide-secondary-200 overflow-x-hidden">
			{#each sortedFollowList as pubkey}
				<li>
					<User
						{handleDelete}
						{user}
						{pubkey}
						kind0={$kind0Events.get(pubkey)?.event}
						isFollower={$followStateMap.get(pubkey)}
						kind1={$kind1Events.get(pubkey)?.event}
					/>
				</li>
			{/each}
		</ul>{/if}
</div>
<!-- <style>
	li {
		content-visibility: auto;
		contain: layout;
	}
</style> -->
