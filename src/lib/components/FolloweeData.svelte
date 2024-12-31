<script lang="ts">
	import User from './User.svelte';

	import {
		dontCheckFollowState,
		followStateMap,
		kind1Events,
		multiple,
		userkind3
	} from '$lib/store/store';
	import { Button, Select, Toggle } from 'svelte-5-ui-lib';

	import { CaretUpSolid, CaretDownSolid } from 'flowbite-svelte-icons';
	import { _ } from 'svelte-i18n';

	import type { SvelteMap } from 'svelte/reactivity';
	import type { EventPacket } from 'rx-nostr';
	import { kind0Events, userNameList, type UserNames } from '$lib/store/runes.svelte';
	import { getProfile } from '$lib/utils/nostr';
	import { getName } from '$lib/utils/util';

	interface SortType {
		value: string;
		name: string;
		href?: string;
	}

	// export let => Props
	let {
		followList,

		handleDelete
	}: { followList: string[]; handleDelete: (pubkey: string) => void } = $props();

	// let userNameList = $derived(getUserNameList(followList, kind0Events.get));
	// $inspect(userNameList);
	// function getUserNameList(followList: string[], kind0Events: SvelteMap<string, EventPacket>) {
	// 	return followList.reduce((before, pub) => {
	// 		const kind0 = kind0Events.get(pub)?.event;
	// 		const petname = $userkind3.tags.find(
	// 			(tag) => tag[0] === 'p' && tag[1] === pub && tag.length > 3
	// 		)?.[3];
	// 		if (kind0) {
	// 			const profile = getProfile(kind0);
	// 			const name = profile?.name;
	// 			const display_name = profile?.display_name;
	// 			return { ...before, [pub]: `${petname}${name}${display_name}` };
	// 		} else {
	// 			return { ...before, [pub]: `${petname}` };
	// 		}
	// 	}, {});
	// }
	// Events

	// $: -> $derived/$effect

	// onMount(() => {
	// 	console.log('mount', $user, followList.length);
	// 	if ($user) {
	// 		getUserEvents(followList, $user);
	// 	}
	// });

	//sort

	let sortSelected: string | undefined = $state('default');
	const sortType: SortType[] = [
		{ value: 'default', name: $_('sortType.default') },
		{ value: 'note', name: $_('sortType.note') },
		{ value: 'name', name: $_('sortType.name') },
		{ value: 'petname', name: $_('sortType.petname') }
	];
	if (!$dontCheckFollowState) {
		sortType.push({ value: 'followStatus', name: $_('sortType.followStatus') });
	}
	let ascending = $state(false);

	const sortedFollowList = $derived.by(() => {
		//console.log(sortSelected);
		switch (sortSelected) {
			case 'default':
				// デフォルト順序
				if (ascending) {
					return followList.slice(); // 元の順序
				} else {
					return followList.slice().reverse(); // 逆順
				}
			//	break;
			case 'note':
				// `created_at` に基づいて並べ替え
				if (ascending) {
					return Array.from($kind1Events.values())
						.filter((ev) => followList.includes(ev.event.pubkey))
						.sort((a, b) => a.event.created_at - b.event.created_at)
						.map((ev) => ev.event.pubkey); //.filter((value)=>followList.includes(value));
				} else {
					return Array.from($kind1Events.values())
						.filter((ev) => followList.includes(ev.event.pubkey))
						.sort((a, b) => b.event.created_at - a.event.created_at)
						.map((ev) => ev.event.pubkey);
				}
			//		break;
			case 'followStatus':
				// フォロー状態に基づいて並べ替え
				return followList.slice().sort((a, b) => {
					// ステータスを明確に数値化
					const statusToValue = (status: boolean | undefined) => {
						if (status === true) return 2; // true を 2
						if (status === false) return 1; // false を 1
						return 0; // undefined を 0
					};
					const aStatus = statusToValue($followStateMap.get(a)?.follow);
					const bStatus = statusToValue($followStateMap.get(b)?.follow);
					return ascending ? aStatus - bStatus : bStatus - aStatus;
				});
			//break;

			case 'petname':
				// ペットネーム順で並べ替え
				return followList.slice().sort((a, b) => {
					const aPetname = $followStateMap.get(a)?.petname || ''; // undefined を空文字列扱い
					const bPetname = $followStateMap.get(b)?.petname || '';
					return ascending
						? aPetname.localeCompare(bPetname) // 昇順
						: bPetname.localeCompare(aPetname); // 降順
				});
			case 'name':
				// ネーム順で並べ替え
				return followList.slice().sort((a, b) => {
					const adata = userNameList.get().get(a);
					const aname = getName(adata) || '';

					// undefined を空文字列扱い
					const bdata = userNameList.get().get(b);
					const bname = getName(bdata) || '';

					return ascending
						? aname.localeCompare(bname) // 昇順
						: bname.localeCompare(aname); // 降順
				});
		}
	});
</script>

<div class="my-2 flex w-full justify-end">
	<Toggle
		onchange={() => ($multiple = !$multiple)}
		checked={$multiple}
		spanClass="border border-primary-400 after:top-[1px]"
		labelClass=" break-wards font-bold">{$_('multiple')}</Toggle
	>
</div>
<div class="rounded-md border border-secondary-500 p-1">
	<div class="flex flex-wrap items-center justify-between">
		<div>
			<span class="font-bold">{$_('followCount')}</span>:
			{followList.length}
			{#if !$dontCheckFollowState}<span class="ml-2 font-bold">{$_('mutualFollow')}🫂</span>: {followList.filter(
					(pub) => $followStateMap.get(pub)?.follow === true
				).length}
				<span class="ml-2 font-bold">{$_('UnilateralFollow')}😐</span>: {followList.filter(
					(pub) => $followStateMap.get(pub)?.follow === false
				).length}<span class="ml-2 font-bold">{$_('unknown')}❔️</span>: {followList.filter(
					(pub) => $followStateMap.get(pub) === undefined
				).length}{/if}
		</div>

		<div class="ml-auto flex gap-1">
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
					<User {handleDelete} {pubkey} />
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
