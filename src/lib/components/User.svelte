<script lang="ts">
	import { getProfile } from '$lib/utils/nostr';
	import { datetime, formatAbsoluteDate, formatRelativeDate } from '$lib/utils/util';
	import * as Nostr from 'nostr-typedef';
	import { Button, Modal, uiHelpers } from 'svelte-5-ui-lib';
	import UserDetail from './ModalUserDetail.svelte';
	import ModalUserDetail from './ModalUserDetail.svelte';

	let {
		pubkey,
		kind0,
		isFollower,
		kind1,
		user
	}: {
		pubkey: string;
		user: string;
		kind0: Nostr.Event | undefined;
		kind1: Nostr.Event | undefined;
		isFollower: boolean | undefined;
	} = $props();
	//userの
	//kind0 表示と
	//kind3 自分が含まれるか
	//最新の kind1 表示
	const profile = $derived(getProfile(kind0));

	const modalUserDetail = uiHelpers();
	let modalStatus = $state(false);

	const closeModal = modalUserDetail.close;
	$effect(() => {
		modalStatus = modalUserDetail.isOpen;
	});
</script>

<div class="grid w-full grid-cols-[auto_auto_1fr_auto]">
	<div class=" mt-1 text-lg">
		{#if isFollower}🫂{:else if isFollower === false}😟{:else}🤔{/if}
	</div>
	<div class=" mr-1 mt-1 h-16 w-16 overflow-hidden rounded-lg border border-secondary-600">
		{#if profile?.picture && profile?.picture !== ''}
			<img
				src={profile?.picture}
				alt="Avatar"
				class=" overflow-hidden object-cover"
				style=" object-fit: cover; object-position: center;"
			/>{/if}
	</div>
	<div class="flex flex-col">
		<div class=" text-secondary-600">
			{profile?.display_name ?? ''}@{profile?.name && profile.name !== '' ? profile.name : 'noname'}
		</div>
		{#if kind1}<div class="font-bold">
				latest note at
				<time class=" inline-flex" datetime={datetime(kind1.created_at)}
					>{formatAbsoluteDate(kind1.created_at)}</time
				>
				( {formatRelativeDate(kind1.created_at, 'ja')} )
			</div>
			<div class="my-1 whitespace-pre-wrap break-words" style="word-break: break-word;">
				{kind1.content}
			</div>{/if}
	</div>
	<div>
		<Button onclick={modalUserDetail.toggle}>detail</Button>
	</div>
</div>
<Modal title="Select Signer" {modalStatus} {closeModal}>
	<ModalUserDetail {kind0} {profile} {kind1} {isFollower} />
</Modal>
