<script lang="ts">
	import SignerConnector from '$lib/components/SignerConnector.svelte';
	import { loading, signer } from '$lib/store/store';
	import { Modal, Button, uiHelpers, Input } from 'svelte-5-ui-lib';
	import { nip19 } from 'nostr-tools';
	import { LOGIN } from '$lib/store/constants';

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
			}

			$loading = false;
		}
	};
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<Button
	onclick={() => {
		$signer = undefined;

		localStorage.removeItem(LOGIN);
	}}>Clear Signer</Button
>

<section>
	<div class="flex">
		<Input bind:value={encodedPub} placeholder="npub~~~" />
		<Button onclick={() => onClickGetPubkey()}>Get publickey</Button>
	</div>
</section>
<Modal title="Select Signer" {modalStatus} {closeModal}>
	<SignerConnector {closeModal} />
</Modal>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
