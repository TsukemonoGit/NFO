<script lang="ts">
	//SignerConnector.svelte
	import { Checkbox } from 'svelte-5-ui-lib';

	import LoginNip46 from './LoginNip46.svelte';
	import LoginNcryptsec from './LoginNcryptsec.svelte';
	import { signer } from '$lib/store/store';
	import { Nip07ExtensionSigner, type Nip07Extension } from 'nostr-signer-connector';
	import { Button } from 'svelte-5-ui-lib';
	import { LOGIN } from '$lib/store/constants';
	import { _ } from 'svelte-i18n';

	const loginType = [/*'nip49',*/ 'nip07', 'nip46'];
	let { closeModal } = $props<{
		closeModal: () => void;
	}>();
	let saveSigner = $state<boolean>(false);
	let selectType = $state(); //loginType[2]

	const handleClickType = (type: string) => {
		selectType = type;
		if (type === 'nip07') {
			$signer = new Nip07ExtensionSigner(window.nostr as Nip07Extension);

			// store session data to LocalStorage
			if (saveSigner) {
				localStorage.setItem(LOGIN, JSON.stringify({ type: 'nip07' }));
			}

			closeModal();
		}
		console.log('signer:', type);
	};
</script>

<div class="flex gap-2">
	{#each loginType as type, index}
		<Button onclick={() => handleClickType(type)}>
			{type}
		</Button>
	{/each}
</div>
<!-- {#if selectType === 'nip07'}
	<LoginNip07 /> -->
<!-- {#if selectType === 'nip49'}
	<LoginNcryptsec /> -->
{#if selectType === 'nip46'}
	<LoginNip46 {closeModal} {saveSigner} /><!---->
{/if}
<Checkbox class="my-auto" classLabel="flex align-center  break-words" bind:checked={saveSigner}
	>{$_('saveSigner')}</Checkbox
>
