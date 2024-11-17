<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { LOGIN } from '$lib/store/constants';
	import { loading, signer, verifier } from '$lib/store/store';
	import {
		Nip07ExtensionSigner,
		type Nip07Extension,
		Nip46RemoteSigner
	} from 'nostr-signer-connector';
	import { onMount } from 'svelte';
	import { Spinner } from 'svelte-5-ui-lib';
	import workerUrl from '$lib/worker?worker&url';
	import type { LoginData } from '../types/types';
	import { browser } from '$app/environment';
	import {
		createNoopClient,
		createVerificationServiceClient,
		type VerificationServiceClient
	} from 'rx-nostr-crypto';
	import { SvelteToast } from '@zerodevx/svelte-toast';

	let { children } = $props();

	//https://github.com/penpenpng/rx-nostr/pull/138
	const verificationClient: void | VerificationServiceClient = browser
		? createVerificationServiceClient({
				worker: new Worker(workerUrl, { type: 'module' }),
				timeout: 600000
			})
		: createNoopClient();
	if (verificationClient) {
		verificationClient.start();
		$verifier = verificationClient.verifier;
	}

	onMount(async () => {
		const localData = localStorage.getItem(LOGIN);
		if (localData) {
			$loading = true;
			try {
				const parsedData: LoginData = JSON.parse(localData);
				if (parsedData.type === 'nip07') {
					$signer = new Nip07ExtensionSigner(window.nostr as Nip07Extension);
				} else if (parsedData.type === 'nip46' && parsedData.session) {
					$signer = await Nip46RemoteSigner.resumeSession(parsedData.session);
				}
			} catch (error) {
				console.log(error);
			}
			$loading = false;
		}
	});
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>

	<footer>
		<p>
			visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
	</footer>
</div>
{#if $loading}
	<Spinner size="16" class=" fixed bottom-5 right-5" />
{/if}
<SvelteToast />

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
