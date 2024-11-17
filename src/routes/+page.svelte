<script lang="ts">
	import { loading, signer } from '$lib/store/store';
	import { Modal, Button, uiHelpers, Input } from 'svelte-5-ui-lib';
	import { nip19 } from 'nostr-tools';
	import { LOGIN } from '$lib/store/constants';
	import { npubRegex } from '$lib/utils/regex';
	import FollowList from '$lib/components/FollowList.svelte';
	import SignerConnector from '$lib/components/Signer/GetPublickey/SignerConnector.svelte';
	import { toast } from '@zerodevx/svelte-toast';

	const modalExample = uiHelpers();
	let modalStatus = $state(false);
	//let publicKey = $state<string>();
	//const closeModal = modalExample.close;
	let encodedPub = $state<string>();
	const closeModal = () => {
		modalExample.toggle();

		onClickGetPubkey();

		modalExample.close();
	};
	$effect(() => {
		modalStatus = modalExample.isOpen;
	});

	const onClickGetPubkey = async () => {
		if (!$signer) {
			modalExample.toggle();
		} else {
			try {
				$loading = true;

				const hexPublicKey = await $signer.getPublicKey();
				encodedPub = nip19.npubEncode(hexPublicKey);
			} catch (error) {
				console.log(error);
				toast.push('failed to set signer', {
					theme: {
						'--toastBackground': ' rgba(255, 60, 0, 0.8)',
						'--toastBarHeight': 0
					}
				});
				$signer = undefined;
			}

			$loading = false;
		}
	};

	const toHex = (npub: string | undefined): string | undefined => {
		npub = npub?.trim();
		if (npub && npubRegex.test(npub)) {
			try {
				return nip19.decode(npub).data as string;
			} catch (error) {
				console.log(error);
			}
		}
	};

	const hexPub = $derived(toHex(encodedPub));
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section class="gap-2">
	<Button
		onclick={() => {
			$signer = undefined;

			localStorage.removeItem(LOGIN);
			toast.push('Signer is cleared', {
				theme: {
					'--toastBarHeight': 0
				}
			});
		}}>Clear Signer</Button
	>
	<div class="flex">
		<Input bind:value={encodedPub} placeholder="npub..." />
		<Button onclick={() => onClickGetPubkey()}>Get publickey</Button>
	</div>
	{#if hexPub}
		<FollowList user={hexPub} />
	{/if}
</section>
<Modal title="Select Signer" {modalStatus} {closeModal}>
	<SignerConnector {closeModal} />
</Modal>

<style>
	section {
		display: flex;
		flex-direction: column;

		align-items: center;
		flex: 0.6;
	}
</style>
