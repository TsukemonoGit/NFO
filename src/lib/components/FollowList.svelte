<script lang="ts">
	import { onMount } from 'svelte';
	import * as Nostr from 'nostr-tools';
	import { kind10002Relay } from '$lib/store/constants';
	import { getEvent } from '$lib/utils/nostr';
	import { now, type OkPacketAgainstEvent } from 'rx-nostr';
	import {
		getRxEvent,
		getUserEvents,
		promisePublishSignedEvent,
		set10002DefaultRelay
	} from '$lib/utils/rxnostr';
	import { hexRegex } from '$lib/utils/regex';
	import FolloweeData from './FolloweeData.svelte';
	import { userkind3, loading, multiple, signer, user } from '$lib/store/store';
	import type { EventParameters } from 'nostr-typedef';
	import { getEventHash, type EventTemplate } from 'nostr-tools';
	import { Modal, uiHelpers } from 'svelte-5-ui-lib';
	import SignerConnector from './Signer/SignerConnector.svelte';
	import { writable } from 'svelte/store';
	import { toast } from '@zerodevx/svelte-toast';
	import { t as _ } from '@konemono/svelte5-i18n';
	import MultipleFixedWindow from './MultipleFixedWindow.svelte';
	import { userNameList } from '$lib/store/runes.svelte';

	const kind10002filters = $derived<Nostr.Filter[]>([
		{ authors: [$user as string], kinds: [10002], until: now(), limit: 1 }
	]);
	const kind3filters = $derived<Nostr.Filter[]>([
		{ authors: [$user as string], kinds: [3], until: now(), limit: 1 }
	]);

	let followList = $state<string[]>([]);

	onMount(async () => {
		//デフォリレーを取る
		$loading = true;
		const kind10002 = await getEvent({
			filters: kind10002filters,
			relays: kind10002Relay,
			timeout: 4000
		});
		console.log('kind10002', kind10002);
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
		console.log('kind3', kind3);
		if (!kind3) {
			//error
			$loading = false;
			return;
		}
		$userkind3 = kind3;
		followList = $state
			.snapshot($userkind3)
			.tags.filter((tag) => tag[0] === 'p' && hexRegex.test(tag[1]))
			.map((tag) => tag[1]);

		getUserEvents(followList);

		followList.map((pub) => {
			const petName = $userkind3.tags.find(
				(tag) => tag.length > 3 && tag[0] === 'p' && tag[1] === pub
			)?.[3];
			userNameList.update((value) =>
				value.set(pub, { petname: petName, name: undefined, display_name: undefined })
			);
		});
	});

	$loading = false;

	const modalSigner = uiHelpers();
	let modalSignerStatus = $state(false);

	$effect(() => {
		modalSignerStatus = modalSigner.isOpen;
	});

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
		if (!userkind3) {
			console.log('error');
			return;
		}
		const snapshotKind3 = $state.snapshot($userkind3);
		// let tags = userkind3
		// 	? structuredClone(userkind3.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag)))
		// 	: [];
		// tags = tags.filter((tag) => !(tag[0] === 'p' && tag[1] === pubkey));
		const tags = snapshotKind3.tags.filter((tag) => !(tag[0] === 'p' && tag[1] === pubkey));
		// userkind3
		//		? structuredClone(userkind3.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag)))
		//	: [];
		//console.log(tags);
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
			content: snapshotKind3.content ?? '',
			created_at: now(),
			pubkey: $user as string
		};

		newKind3 = { ...newKind3, id: getEventHash(newKind3) };
		$newKind3Template = newKind3;
		signEventTmp(newKind3);
		//  console.log(result)
	};
	const beforeCloseSignerModal = (ncrysec: string | undefined) => {
		console.log('before close signer modal', ncrysec);
	};
	const closeSignerModal = () => {
		console.log('close signer modal');
		if (!$newKind3Signed && $newKind3Template) {
			// let tags = $newKind3Template
			// 	? structuredClone(
			// 			$newKind3Template.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag))
			// 		)
			// 	: [];
			const tags = $newKind3Template.tags.map((tag) => (Array.isArray(tag) ? [...tag] : tag));

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
		//console.log($signer);
		if (!$signer) {
			modalSigner.toggle();
		} else {
			try {
				$loading = true;
				const signedEvent = await $signer.signEvent(ev);
				console.log('Signed Event:', signedEvent);

				//署名したら署名者のpubに上書きされるからチェックする
				if (signedEvent.pubkey !== $user) {
					toast.push($_('mismatchPubkey'), {
						theme: {
							'--toastBackground': ' rgba(255, 60, 0, 0.8)',
							'--toastBarHeight': 0
						}
					});
					$newKind3Template = undefined;
					$newKind3Signed = undefined;
					return;
				}

				$newKind3Signed = signedEvent;
				const { event: resEvent, res } = await promisePublishSignedEvent(signedEvent);
				console.log(res);
				const isSuccessRelays: string[] = res.filter((item) => item.ok).map((item) => item.from);
				toast.push(`<strong>Success</strong><br>${isSuccessRelays.join('<br>')}`, {
					theme: {
						'--toastBarHeight': 0
					}
				});
				if (isSuccessRelays.length > 0) {
					$userkind3 = resEvent;

					followList = $state
						.snapshot($userkind3)
						.tags.filter((tag) => tag[0] === 'p' && hexRegex.test(tag[1]))
						.map((tag) => tag[1]);
				}
			} catch (error) {
				console.error('Error during signing:', error);
				toast.push('Error during signing', {
					theme: {
						'--toastBackground': ' rgba(255, 60, 0, 0.8)',
						'--toastBarHeight': 0
					}
				});
			} finally {
				$loading = false;
				console.log('Signed event:', $newKind3Signed);
			}
		}
	};
</script>

{#if !$userkind3}
	loading...
{:else if followList.length === 0 && !$loading}
	{$_('follow_zero')}
{:else}
	<FolloweeData {followList} {handleDelete} />
{/if}
<Modal title="Select Signer" modalStatus={modalSignerStatus} closeModal={closeSignerModal}>
	<SignerConnector
		closeModal={(ncrysec) => {
			beforeCloseSignerModal(ncrysec);
		}}
		sign={true}
	/>
</Modal>
{#if $multiple}
	<MultipleFixedWindow bind:followList />
{/if}
