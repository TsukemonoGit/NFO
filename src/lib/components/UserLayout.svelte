<script lang="ts">
	import { dontCheckFollowState, followStateMap, kind1Events } from '$lib/store/store';
	import { datetime, formatAbsoluteDate, formatRelativeDate, getName } from '$lib/utils/util';
	import { getProfile } from '$lib/utils/nostr';
	import { locale } from 'svelte-i18n';
	import { kind0Events, userNameList } from '$lib/store/runes.svelte';

	let { pubkey } = $props<{ pubkey: string }>();
	let kind0 = $derived(kind0Events.get().get(pubkey)?.event);
	let isFollower = $derived($followStateMap.get(pubkey)?.follow);
	let kind1 = $derived($kind1Events.get(pubkey)?.event);
	let petname = $derived($followStateMap.get(pubkey)?.petname);

	const profile = $derived(getProfile(kind0));
</script>

<div class="grid w-full grid-cols-[auto_1fr] p-1">
	<div>
		<div class="relative mr-1 mt-1 h-16 w-16">
			<div class="absolute h-16 w-16 overflow-hidden rounded-lg border border-secondary-600">
				{#if profile?.picture && profile?.picture !== ''}
					<img
						src={profile?.picture}
						alt="Avatar"
						class="absolute overflow-hidden object-cover"
						style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
					/>{:else}<div class="flex h-full items-center justify-center text-center">
						no<br />Avatar
					</div>{/if}
			</div>
			{#if !$dontCheckFollowState}<div
					class="align-center absolute -left-1 -top-1 z-10 flex h-6 w-6 items-center justify-center overflow-visible rounded-full border border-secondary-600 bg-white"
				>
					{#if isFollower}🫂{:else if isFollower === false}😐{:else}❔️{/if}
				</div>{/if}
		</div>
	</div>
	<div class="flex flex-col">
		<div class=" text-secondary-600">
			{getName(userNameList.get().get(pubkey)) || 'undefined'}
			<!-- {profile?.display_name ?? ''}@{profile?.name && profile.name !== '' ? profile.name : 'noname'} -->
		</div>
		{#if petname}
			<span class=" font-bold"
				>Named you "<span class="rounded-md bg-secondary-200 p-1">{petname}</span>" (petname)</span
			>
		{/if}
		{#if kind1}<div class="font-bold">
				latest note at
				<time class=" inline-flex" datetime={datetime(kind1.created_at)}
					>{formatAbsoluteDate(kind1.created_at)}</time
				>
				( {formatRelativeDate(kind1.created_at, $locale)} )
			</div>
			<div class="my-1 whitespace-pre-wrap break-words" style="word-break: break-word;">
				{kind1.content}
			</div>{/if}
	</div>
</div>
