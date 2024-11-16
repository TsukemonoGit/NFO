<script lang="ts">
	import { onMount } from 'svelte';
	import * as Nostr from 'nostr-tools';
	import { kind10002Relay } from '$lib/store/constants';
	import { getEvent } from '$lib/utils/nostr';
	import { now } from 'rx-nostr';
	import { getRxEvent, set10002DefaultRelay } from '$lib/utils/rxnostr';
	import { hexRegex } from '$lib/utils/regex';
	import FolloweeData from './FolloweeData.svelte';

	let {
		user
	}: {
		user: string;
	} = $props();

	let kind3Event = $state<Nostr.Event>();
	const kind10002filters = $derived<Nostr.Filter[]>([
		{ authors: [user], kinds: [10002], until: now(), limit: 1 }
	]);
	const kind3filters = $derived<Nostr.Filter[]>([
		{ authors: [user], kinds: [3], until: now(), limit: 1 }
	]);
	onMount(async () => {
		//デフォリレーを取る

		const kind10002 = await getEvent({
			filters: kind10002filters,
			relays: kind10002Relay,
			timeout: 4000
		});
		console.log(kind10002);
		if (!kind10002) {
			//error
			return;
		}

		//フォローリストを取る
		set10002DefaultRelay(kind10002);
		const kind3 = await getRxEvent({
			filters: kind3filters
		});
		console.log(kind3);
		if (!kind3) {
			//error
			return;
		}
		kind3Event = kind3;
	});
	const followList = $derived<string[]>(
		kind3Event
			? kind3Event.tags
					.filter((tag) => tag[0] === 'p' && hexRegex.test(tag[1]))
					.map((tag) => tag[1])
			: []
	);
</script>

{#if !kind3Event}
	loading...
{:else}
	<FolloweeData {followList} {user} />
{/if}
