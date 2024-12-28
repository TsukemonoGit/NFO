<script lang="ts">
	import { page } from '$app/stores';
	import { zapIcon, shareIcon, githubIcon } from '$lib/utils/icons';

	const handleClickShare = async () => {
		const shareData = {
			title: 'Nostr Follow Organizer',
			//text: '[Nostr Follow Organizer]',
			url: $page.url.href
		};

		try {
			await navigator.share(shareData);
		} catch (error: any) {
			console.error(error.message);
		}
	};
</script>

<header class="flex w-full flex-row-reverse items-center gap-1 px-1">
	<button class="fill-black/80 hover:fill-secondary-600" onclick={handleClickShare}>
		{@html shareIcon}
	</button><nostr-share data-type="icon" icon-size="32"></nostr-share>
	<a
		aria-label="github"
		class="w-8 fill-black/80 hover:fill-secondary-600"
		title="https://github.com/TsukemonoGit/NFO"
		href="https://github.com/TsukemonoGit/NFO"
		target="_blank"
		rel="noopener noreferrer"
	>
		{@html githubIcon}
	</a>
	<button
		data-npub="npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
		data-note-id="note1l2l9065psq3qxr5dy9th5yrpfdp0aq7gfjq6l83qxd9khqm5ru3srh0j0c"
		data-relays="wss://relay.damus.io,wss://relay.snort.social,wss://nostr.wine,wss://relay.nostr.band"
		class="fill-primary-600/80 hover:fill-secondary-600"
	>
		{@html zapIcon}
	</button> <script src="https://cdn.jsdelivr.net/npm/nostr-zap@1.1.0"></script>
	<script
		src="
https://cdn.jsdelivr.net/npm/@konemono/nostr-share-component@0.2.0/dist/nostr-share-component.min.js
"
	></script>
</header>
