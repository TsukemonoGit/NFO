<script lang="ts">
	import { Button, Input, Label } from 'svelte-5-ui-lib';
	import { SecretKeySigner } from 'nostr-signer-connector';
	import { signer } from '$lib/store/store';
	import { toast } from '@zerodevx/svelte-toast';

	let ncryptsec = $state<string>('');
	let password = $state<string>('');

	const handleClick = () => {
		try {
			$signer = new (SecretKeySigner as any).fromEncryptedKey(ncryptsec, password);
		} catch (error) {
			console.log(error);
			toast.push('Error', {
				theme: {
					'--toastBackground': ' rgba(255, 60, 0, 0.8)',
					'--toastBarHeight': 0
				}
			});
		}
	};
</script>

<div>
	<div class="mb-6">
		<Label for="email" class="mb-2">NIP-49 encrypted key</Label>
		<Input type="string" id="ncryptsec" autocomplete="username" placeholder="ncrypt...." required />
	</div>
	<div class="mb-6">
		<Label for="password" class="mb-2">Password</Label>
		<Input
			type="password"
			name="password"
			autocomplete="new-password"
			id="password"
			placeholder="•••••••••"
			required
		/>
	</div>
</div>
<div class="text-sm text-neutral-400">
	Even if the "Save Signer Information" checkbox is checked, the signer information is not saved for
	NIP-49 signers.
</div>
<Button onclick={handleClick} color="secondary" class=" w-full">OK</Button>
