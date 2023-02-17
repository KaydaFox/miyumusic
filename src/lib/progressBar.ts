export function progressBar(current: number, total: number, size = 20): string {
	const percentage = current / total;
	const progress = Math.round(size * percentage);
	const emptyProgress = size - progress;
	return `[${'█'.repeat(progress)}${'░'.repeat(emptyProgress)}]`;
}
