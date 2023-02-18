// export default function createChunks(arr: any[], chunkSize: number) {
// 	const chunks = [];
// 	for (let i = 0; i < arr.length; i += chunkSize) {
// 		chunks.push(arr.slice(i, i + chunkSize));
// 	}
// 	return chunks;
// }

export default function createChunks(array: any[], size: number) {
	const chunked_arr = [];
	let index = 0;
	while (index < array.length) {
		chunked_arr.push(array.slice(index, size + index));
		index += size;
	}
	return chunked_arr;
}
