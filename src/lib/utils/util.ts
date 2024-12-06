import type { UserNames } from '$lib/store/runes.svelte';
import type { EventPacket } from 'rx-nostr';

export function datetime(unixtime: number) {
	const time = new Date(unixtime * 1000);

	return time.toISOString();
}

export function formatAbsoluteDate(unixTime: number, full: boolean = false): string {
	const date = new Date(unixTime * 1000);
	const now = new Date();

	const sameYear = date.getFullYear() === now.getFullYear();
	const sameMonth = sameYear && date.getMonth() === now.getMonth();
	const sameDay = sameMonth && date.getDate() === now.getDate();

	const options: Intl.DateTimeFormatOptions = {
		hour: '2-digit',
		minute: '2-digit'
	};

	if (full || !sameDay) {
		options.month = '2-digit';
		options.day = '2-digit';
	}

	if (full || !sameYear) {
		options.year = 'numeric';
	}

	return date.toLocaleString([], options);
}

export function formatRelativeDate(unixTime: number, locale: string | null | undefined): string {
	const date = new Date(unixTime * 1000);
	const now = new Date();
	const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);

	const minutes = Math.floor(secondsDiff / 60);
	const hours = Math.floor(secondsDiff / 3600);
	const days = Math.floor(secondsDiff / 86400);
	const months = Math.floor(days / 30); // おおよその計算
	const years = Math.floor(days / 365); // おおよその計算

	// ローカライズされたメッセージ
	const messages = {
		en: {
			seconds: 'seconds ago',
			minutes: 'minutes ago',
			hours: 'hours ago',
			days: 'days ago',
			months: 'months ago',
			years: 'years ago'
		},
		ja: {
			seconds: '秒前',
			minutes: '分前',
			hours: '時間前',
			days: '日前',
			months: 'ヶ月前',
			years: '年前'
		}
	};

	const msg = locale === 'ja' ? messages['ja'] : messages['en'];

	if (secondsDiff < 60) {
		return `${secondsDiff} ${msg.seconds}`;
	} else if (minutes < 60) {
		return `${minutes} ${msg.minutes}`;
	} else if (hours < 24) {
		return `${hours} ${msg.hours}`;
	} else if (days < 30) {
		return `${days} ${msg.days}`;
	} else if (months < 12) {
		return `${months} ${msg.months}`;
	} else {
		return `${years} ${msg.years}`;
	}
}

export function sortEventPackets<A extends EventPacket>(events: A[]): A[] {
	return events.sort((a: A, b: A): number => {
		if (a.event.created_at !== b.event.created_at) {
			return b.event.created_at - a.event.created_at;
		}
		return a.event.id.localeCompare(b.event.id);
	});
}
export function getName(data: UserNames | undefined): string | undefined {
	if (!data) return undefined;

	const name = `${data.petname ? `${data.petname}📛` : ''} ${data.display_name ? `${data.display_name}` : ''}${data.name ? `@${data.name}` : ''}`;
	if (name === '') {
		return undefined;
	} else {
		return name;
	}
}
