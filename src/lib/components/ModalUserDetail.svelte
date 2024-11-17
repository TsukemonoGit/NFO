<script lang="ts">
	import * as Nostr from 'nostr-typedef';
	import type { Profile } from '../../types/types';
	import { NIP05_REGEX } from 'nostr-tools/nip05';

	let {
		kind0,
		kind1,
		isFollower,
		profile
	}: {
		kind0: Nostr.Event | undefined;
		kind1: Nostr.Event | undefined;
		isFollower: boolean | undefined;
		profile: Profile | undefined;
	} = $props();

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
	const otherProfile = Object.fromEntries(
		Object.entries(profile || {}).filter(([key]) => !excludedKeys.includes(key))
	);
	console.log(otherProfile);
</script>

{#if !profile}
	No Data
{:else}
	<div class="grid grid-cols-[auto_1fr] py-1">
		<div class="flex flex-col items-center">
			<div class=" mr-1 mt-1 h-20 w-20 overflow-hidden rounded-lg border border-secondary-600">
				{#if profile?.picture && profile?.picture !== ''}
					<img
						src={profile?.picture}
						alt="Avatar"
						class=" overflow-hidden object-cover"
						style=" object-fit: cover; object-position: center;"
					/>{/if}
			</div>
			{#if isFollower}🫂{:else if isFollower === false}😟{:else}❔️{/if}
		</div>
		<div class="relative p-1">
			{#if profile.banner}
				<div
					class="bg-magnum-800 border-magnum-400 pointer-events-none absolute w-full overflow-hidden border-b opacity-10"
				>
					<img
						src={profile.banner}
						alt="banner"
						class="mx-auto overflow-hidden object-cover"
						style="height: 100%;  object-fit: cover; object-position: center;"
						loading="lazy"
					/>
				</div>{/if}
			<div
				class="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-secondary-500 p-1"
				style="word-break: break-word;"
			>
				{profile?.about?.trim()}
			</div>

			{#if profile?.nip05}
				{@const nostrjson = nip05href(profile?.nip05)}
				{#if nostrjson}
					<div class=" whitespace-pre-wrap break-words" style="word-break: break-word;">
						<span class="font-bold">nip-05</span>:<a
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
