<script lang="ts">
	import { getProfile } from '$lib/utils/nostr';
	import { datetime, formatAbsoluteDate, formatRelativeDate } from '$lib/utils/util';
	import * as Nostr from 'nostr-typedef';

	let {
		pubkey,
		kind0,
		isFollower,
		kind1,
		user
	}: {
		pubkey: string;
		user: string;
		kind0: Nostr.Event | undefined;
		kind1: Nostr.Event | undefined;
		isFollower: boolean | undefined;
	} = $props();
	//userの
	//kind0 表示と
	//kind3 自分が含まれるか
	//最新の kind1 表示
	const profile = $derived(getProfile(kind0));
</script>

<div class="grid grid-cols-[auto_1fr]">
	<div class="m-1 h-16 w-16 overflow-hidden rounded-lg">
		<img
			src={profile?.picture}
			alt="Avatar"
			class=" overflow-hidden object-cover"
			style=" object-fit: cover; object-position: center;"
		/>
	</div>
	<div class="flex flex-col">
		<div class=" text-secondary-600">
			{profile?.display_name ?? ''}@{profile?.name ?? 'noname'}
			<div class="float-end inline-flex">
				{#if isFollower}🫂{:else if isFollower === false}😟{:else}🤔{/if}
			</div>
		</div>
		{#if kind1}
			<div class="font-bold">
				latest note at
				<time class=" inline-flex" datetime={datetime(kind1.created_at)}
					>{formatAbsoluteDate(kind1.created_at)}</time
				>
				( {formatRelativeDate(kind1.created_at, 'ja')} )
			</div>
			{kind1.content}{/if}
	</div>
</div>
