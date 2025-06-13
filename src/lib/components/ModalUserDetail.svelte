<script lang="ts">
	import { NIP05_REGEX } from 'nostr-tools/nip05';
	import { nip19 } from 'nostr-tools';
	import { followStateMap, kind3Events } from '$lib/store/store';
	import { kind0Events } from '$lib/store/runes.svelte';
	import { getProfile } from '$lib/utils/nostr';
	interface Props {
		pubkey: string;
	}
	let { pubkey }: Props = $props();
	let kind0 = $derived(kind0Events.get().get(pubkey)?.event);
	let isFollower = $derived($followStateMap.get(pubkey)?.follow);
	let petname = $derived($followStateMap.get(pubkey)?.petname);
	let followLength = $derived(
		$kind3Events.get(pubkey)?.event.tags.filter((tag) => tag[0] === 'p').length
	);
	let profile = $derived(getProfile(kind0));

	const nip05href = (str: string): undefined | string => {
		if (!NIP05_REGEX.test(str)) {
			return undefined;
		}
		const match = str.match(NIP05_REGEX);
		//console.log(match);
		if (match && match.length > 2) {
			return `https://${match[2]}/.well-known/nostr.json?name=${match[1]}`;
		} else {
			return undefined;
		}
	};
	const excludedKeys = [
		'name',
		'about',
		'picture',
		'nip05',
		'display_name',
		'website',
		'banner',
		'bot',
		'lud16',
		'lud06'
	];
	let otherProfile = $derived(
		Object.fromEntries(Object.entries(profile || {}).filter(([key]) => !excludedKeys.includes(key)))
	);
	//console.log(otherProfile);
</script>

<div class="relative">
	<div
		class="pointer-events-none absolute left-0 top-0 h-full w-full opacity-10"
		style={`background-image: url(${profile?.banner}); background-size: contain; background-position: center; `}
	></div>
	{#if !profile}
		No Data
	{:else}
		<div class="grid h-60 grid-cols-[auto_1fr] overflow-x-hidden py-1">
			<div class="flex flex-col items-center">
				<div class="mr-1 mt-1 h-20 w-20 overflow-hidden rounded-lg border border-secondary-600">
					{#if profile?.picture && profile?.picture !== ''}
						<img
							src={profile?.picture}
							alt="Avatar"
							class="overflow-hidden object-cover"
							style=" object-fit: cover; object-position: center;"
						/>{/if}
				</div>
				{#if isFollower}🫂{:else if isFollower === false}😐{:else}❔️{/if}
			</div>
			<div class=" overflow-y-auto overflow-x-hidden p-1">
				<div
					class=" mb-1 whitespace-pre-wrap break-words rounded-md border border-secondary-500 p-1"
					style="word-break: break-word;"
				>
					{profile?.about?.trim()}
				</div>
				{#if petname}
					<span class=" font-bold"
						>Named you <span class="rounded-md bg-secondary-200 p-1">"{petname}"</span>as
						petname(nickname).</span
					>
				{/if}
				{#if followLength}
					<div class="flex flex-wrap items-center">
						<span class=" mr-2 font-bold">Following: </span>
						{followLength}
					</div>
				{/if}
				{#if profile?.nip05}
					{@const nostrjson = nip05href(profile?.nip05)}
					{#if nostrjson}
						<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
							<span class="font-bold">nip05</span>:<a
								href={nostrjson}
								target="_blank"
								rel="noopener noreferrer"
								class="max-h-48 overflow-y-auto whitespace-pre-wrap break-words"
								style="word-break: break-word;"
							>
								{profile?.nip05}
							</a>
						</div>{/if}{/if}
				{#if profile?.website}
					<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
						<span class="font-bold">website</span>:<a
							href={profile?.website}
							target="_blank"
							rel="noopener noreferrer"
							class="max-h-48 overflow-y-auto whitespace-pre-wrap break-words"
							style="word-break: break-word;"
						>
							{profile?.website?.trim()}
						</a>
					</div>{/if}

				{#if profile.bot}
					<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
						<span class="font-bold">bot</span>:{profile.bot}
					</div>
				{/if}
				{#if profile.lud16}
					<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
						<span class="font-bold">lud16</span>:{profile.lud16}
					</div>
				{/if}
				{#if profile.lud06}
					<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
						<span class="font-bold">lud06</span>:{profile.lud06}
					</div>
				{/if}
				{#if profile?.banner}
					<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
						<span class="font-bold">banner</span>:<a
							href={profile?.banner}
							target="_blank"
							rel="noopener noreferrer"
							class="max-h-48 overflow-y-auto whitespace-pre-wrap break-words"
							style="word-break: break-word;"
						>
							{profile?.banner?.trim()}
						</a>
					</div>{/if}
				{#if otherProfile && Object.keys(otherProfile).length > 0}
					{#each Object.keys(otherProfile) as key}
						{#if otherProfile[key] && otherProfile[key] !== ''}
							{#if typeof otherProfile[key] === 'object'}
								<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
									<span class="font-bold">{key}</span>:
									{JSON.stringify(otherProfile[key], null, 2)}
								</div>
							{:else}
								<!-- Handle Other Types (String, Number, etc.) -->
								<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
									<span class="font-bold">{key}</span>: {otherProfile[key]}
								</div>
							{/if}
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	{/if}
	<div class=" break-all text-end font-mono text-xs font-bold text-neutral-500">
		{kind0 ? nip19.npubEncode(kind0.pubkey) : ''}
	</div>
</div>
