export default function formatTime(ms: number) {
	const seconds = Math.floor((ms / 1000) % 60).toString();
	const minutes = Math.floor((ms / (1000 * 60)) % 60).toString();

	return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}
