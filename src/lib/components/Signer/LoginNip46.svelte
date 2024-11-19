<script lang="ts">
	import { LOGIN } from '$lib/store/constants';
	import { loading, signer } from '$lib/store/store';
	import { Nip46RemoteSigner, type Nip46ClientMetadata } from 'nostr-signer-connector';
	import QRCode from 'qrcode';
	import { Input } from 'svelte-5-ui-lib';
	let connToken = $state<string>();
	let { closeModal, saveSigner } = $props<{
		closeModal: () => void;
		saveSigner: boolean;
	}>();
	import { page } from '$app/stores';
	import { toast } from '@zerodevx/svelte-toast';

	const relayUrls = ['wss://relay.nsec.app/'];
	const client: Nip46ClientMetadata = {
		name: 'svelte5SampleClient',
		url: $page.url.origin,
		description: 'just a sample'
	};

	// const eventParam = {
	// 	content: 'test',
	// 	kind: 1,
	// 	tags: [] as string[][],
	// 	created_at: Date.now() / 1000
	// };
	let connectUri = $state<string>();

	//Initiated by the client
	const onClickConnectClient = async (num: number) => {
		connectUri = undefined;
		console.log('onClickConnectClient');
		const { connectUri: uri, established } = Nip46RemoteSigner.listenConnectionFromRemote(
			relayUrls,
			client
		);
		switch (num) {
			case 0:
				//nsec.app
				window.open(
					`https://use.nsec.app/nostrconnect/${uri.replace('nostrconnect://', '')}`,
					'_blank',
					'noreferrer'
				);
				break;
			case 1:
				//amber
				window.open(uri, '_blank', 'noreferrer');
				break;
			case 2:
				//他
				connectUri = uri;
				break;
		}

		// show the connect URI to user
		console.log('paste this URI on Nostr Connect signer:', connectUri);

		try {
			$loading = true;
			// wait until a session to a remote signer is established...
			const { signer: sig, session } = await established;
			$signer = sig;
			closeModal();
			if (saveSigner) {
				localStorage.setItem(
					LOGIN,
					JSON.stringify({ type: 'nip46', /*signer: signer,*/ session: session })
				);
			}

			// use the signer as you want...
			//const ev = await sig.signEvent(eventParam);
			//console.log(ev);
		} catch (error) {
			console.log(error);
			toast.push('Error', {
				theme: {
					'--toastBackground': ' rgba(255, 60, 0, 0.8)',
					'--toastBarHeight': 0
				}
			});
		}
		$loading = false;
	};

	//Initiated by remote-signer
	const onClickConnectRemote = async () => {
		if (!connToken) {
			return;
		}

		try {
			const { signer: sig, session } = await Nip46RemoteSigner.connectToRemote(connToken);

			// store session data to LocalStorage
			if (saveSigner) {
				localStorage.setItem(
					LOGIN,
					JSON.stringify({ type: 'nip46', /*signer: signer,*/ session: session })
				);
			}
			$signer = sig;
			closeModal();
			//	const ev = await sig.signEvent(eventParam);
			//console.log(ev);
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

	const onclickCopy = async () => {
		if (!connectUri) {
			return;
		}
		await navigator?.clipboard.writeText(connectUri);
	};
</script>

<div class="">
	<div class="font-bold">Initiated by the client</div>
	<button class="bg-yellow-300" onclick={() => onClickConnectClient(0)}>Connect Nsec.app</button>
	<button class="bg-yellow-300" onclick={() => onClickConnectClient(1)}>Connect Amber</button>

	<button class="bg-yellow-300" onclick={() => onClickConnectClient(2)}>Other</button>
	{#if connectUri}
		<div>
			Nostr Connect QR code
			{#await QRCode.toDataURL(connectUri)}
				loading
			{:then dataUrl}
				<a
					href={connectUri}
					target="_blank"
					rel="noopener noreferrer"
					class="bg-magnum-500 dark:bg-magnum-500 rounded-md p-2 shadow hover:opacity-75"
				>
					<img src={dataUrl} alt="invoice" class="h-52 w-52 max-w-full object-contain" />
				</a>
			{/await}
		</div>

		<button class="bg-yellow-300" onclick={onclickCopy}
			>Nostr Connect URL をクリップボードにコピー</button
		>
	{/if}
</div>

<div class="w-full">
	<div class="font-bold">Initiated by remote-signer</div>
	<div class="flex">
		<Input bind:value={connToken} placeholder="bunker://~~?relay=~~&secret=~~" />
		<button class="bg-yellow-300" onclick={onClickConnectRemote}>Connect</button>
	</div>
</div>
