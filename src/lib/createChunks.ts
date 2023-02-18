export default function createChunks<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	let index = 0;
	while (index < array.length) {
		chunks.push(array.slice(index, size + index));
		index += size;
	}
	return chunks;
}
