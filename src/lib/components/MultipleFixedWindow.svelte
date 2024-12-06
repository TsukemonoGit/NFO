<script lang="ts">
	import { deleteList, userkind3, loading, multiple, signer, user } from '$lib/store/store';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import { Button, Modal, uiHelpers } from 'svelte-5-ui-lib';
	import { _ } from 'svelte-i18n';
	import UserLayout from './UserLayout.svelte';
	import { now } from 'rx-nostr';
	import { getEventHash, type EventTemplate } from 'nostr-tools';
	import { writable } from 'svelte/store';
	import { toast } from '@zerodevx/svelte-toast';
	import { hexRegex } from '$lib/utils/regex';
	import { promisePublishSignedEvent } from '$lib/utils/rxnostr';
	let { followList = $bindable() } = $props<{ followList: string[] }>();

	const modalDeletePopup = uiHelpers();
	let modalDeleteStatus = $state(false);
	const closeDeleteModal = modalDeletePopup.close;
	$effect(() => {
		modalDeleteStatus = modalDeletePopup.isOpen;
	});

	const modalSigner = uiHelpers();
	let modalSignerStatus = $state(false);

	$effect(() => {
		modalSignerStatus = modalSigner.isOpen;
	});

	const handleClickDelete = () => {
		modalDeletePopup.toggle();
	};

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

	const handleSureDelete = () => {
		$newKind3Template = undefined;
		console.log($state.snapshot($deleteList));
		const snapshotKind3 = $state.snapshot($userkind3);

		const tags = snapshotKind3.tags.filter(
			(tag) => !(tag[0] === 'p' && $deleteList.includes(tag[1]))
		);

		console.log(snapshotKind3.tags.length, tags.length);

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
					//	$newKind3Signed = undefined;
					return;
				}

				//signedEvent;
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

					followList = resEvent.tags
						.filter((tag) => tag[0] === 'p' && hexRegex.test(tag[1]))
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
				$multiple = false;
				$loading = false;
				//	console.log('Signed event:', $newKind3Signed);
			}
		}
	};
</script>

<div class="h-42 fixed bottom-0 left-1/2 w-60 -translate-x-1/2">
	<div
		class="flex h-full w-full items-center justify-center gap-2 rounded-md bg-secondary-200 p-2 font-bold"
	>
		<div>
			Selected: <span class=" text-secondary-700">{$deleteList.length}</span>
		</div>
		<Button onclick={handleClickDelete} class="font-bold">DELETE</Button>
	</div>
</div>
<Modal size="xs" modalStatus={modalDeleteStatus} closeModal={closeDeleteModal}>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			{$_('unfollow.text')}
		</h3>
		<div class="mb-4 rounded-md border border-secondary-400 py-2">
			<div class="break-words font-bold">Number of users to delete: {$deleteList.length}</div>
			<ul
				class="flex h-60 max-h-[70%] w-full flex-col divide-y divide-secondary-200 overflow-y-auto overflow-x-hidden"
			>
				{#each $deleteList as pubkey}
					<li class="text-left">
						<UserLayout {pubkey} />
					</li>
				{/each}
			</ul>
		</div>
		<Button
			color="red"
			class="me-2"
			onclick={async () => {
				modalDeletePopup.isOpen = false;

				handleSureDelete();
			}}>{$_('unfollow.sure')}</Button
		>
		<Button color="alternative" onclick={() => (modalDeletePopup.isOpen = false)}
			>{$_('unfollow.cancel')}</Button
		>
	</div>
</Modal>
