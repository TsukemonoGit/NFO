<script lang="ts">
	import { type Nip07Extension, Nip07ExtensionSigner } from 'nostr-signer-connector';
	import { signer } from '$lib/store/store';

	const onClickLigin = () => {
		$signer = new Nip07ExtensionSigner(window.nostr as Nip07Extension);
	};
	// store session data to LocalStorage
	// localStorage.setItem(
	// 	LOGIN,
	// 	JSON.stringify({ type: 'nip07'})
	// );
</script>

NIP-07でログイン
<button class="bg-yellow-300" onclick={onClickLigin}>NIP-07</button>
