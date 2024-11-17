<script lang="ts">
	import { onMount } from 'svelte';
	import * as Nostr from 'nostr-tools';
	import { kind10002Relay } from '$lib/store/constants';
	import { getEvent } from '$lib/utils/nostr';
	import { now, type OkPacketAgainstEvent } from 'rx-nostr';
	import { getRxEvent, promisePublishSignedEvent, set10002DefaultRelay } from '$lib/utils/rxnostr';
	import { hexRegex } from '$lib/utils/regex';
	import FolloweeData from './FolloweeData.svelte';
	import { loading, signer } from '$lib/store/store';
	import type { EventParameters } from 'nostr-typedef';
	import { getEventHash, type EventTemplate, type UnsignedEvent } from 'nostr-tools';
	import { Modal, uiHelpers } from 'svelte-5-ui-lib';
	import SignerConnector from './Signer/GetPublickey/SignerConnector.svelte';
	import { writable } from 'svelte/store';

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
		$loading = true;
		const kind10002 = await getEvent({
			filters: kind10002filters,
			relays: kind10002Relay,
			timeout: 4000
		});
		console.log(kind10002);
		if (!kind10002) {
			//error
			$loading = false;
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
			$loading = false;
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
	$loading = false;

	const modalSigner = uiHelpers();
	let modalSignerStatus = $state(false);
	const newKind3Template = writable<
		| {
				kind: number;
				tags: string[][];
				content: string;
				pubkey: string;
				created_at: number;
				sig?: string;
				id?: string;
		  }
		| undefined
	>();
	const newKind3Signed = writable<Nostr.Event | undefined>();
	const handleDelete = async (pubkey: string) => {
		$newKind3Template = undefined;
		$newKind3Signed = undefined;
		console.log('delete', pubkey);
		if (!kind3Event) {
			console.log('error');
			return;
		}
		let tags = kind3Event
			? structuredClone(kind3Event.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag)))
			: [];
		tags = tags.filter((tag) => !(tag[0] === 'p' && tag[1] === pubkey));
		// kind3Event
		//		? structuredClone(kind3Event.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag)))
		//	: [];
		console.log(tags);
		let newKind3: {
			kind: number;
			tags: string[][];
			content: string;
			pubkey: string;
			created_at: number;
			sig?: string;
			id?: string;
		} = {
			kind: 3,
			tags: tags,
			content: kind3Event.content ?? '',
			created_at: now(),
			pubkey: user
		};

		newKind3 = { ...newKind3, id: getEventHash(newKind3) };
		$newKind3Template = newKind3;
		signEventTmp(newKind3);
		//  console.log(result)
	};
	const closeSignerModal = () => {
		console.log('close signer modal');
		if (!$newKind3Signed && $newKind3Template) {
			let tags = $newKind3Template
				? structuredClone(
						$newKind3Template.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag))
					)
				: [];
			const ev: EventParameters = { ...$newKind3Template, tags: tags };

			console.log(ev);
			signEventTmp(ev as EventTemplate);
		}
		modalSigner.toggle();

		modalSigner.close();
	};

	const signEventTmp = async (ev: EventTemplate | undefined) => {
		if (!ev) {
			return;
		}

		console.log('Event before signing:', ev);
		console.log($signer);
		if (!$signer) {
			modalSigner.toggle();
		} else {
			try {
				$loading = true;
				const signedEvent = await $signer.signEvent(ev);
				$newKind3Signed = signedEvent;
				const { event: resEvent, res } = await promisePublishSignedEvent(signedEvent);
				console.log(res);
				const isSuccessRelays: OkPacketAgainstEvent[] = res.filter((item) => item.ok);
				if (isSuccessRelays.length > 0) {
					kind3Event = resEvent;
					//現状kind3が変わったらfollowListもかわるし、kind0とかkind1とか取り直されてしまうのでなんかいい感じにしないといけない
				}
			} catch (error) {
				console.error('Error during signing:', error);
			} finally {
				$loading = false;
				console.log('Signed event:', $newKind3Signed);
			}
		}
	};

	$effect(() => {
		modalSignerStatus = modalSigner.isOpen;
	});
</script>

{#if !kind3Event}
	loading...
{:else if followList && followList.length === 0 && !$loading}
	フォローゼロです
{:else}
	<FolloweeData {followList} {user} {handleDelete} />
{/if}
<Modal title="Select Signer" modalStatus={modalSignerStatus} closeModal={closeSignerModal}>
	<SignerConnector closeModal={closeSignerModal} />
</Modal>
