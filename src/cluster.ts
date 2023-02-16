import './lib/setup';
import { ClusterManager } from 'discord-hybrid-sharding';

const manager = new ClusterManager(`${__dirname}/index.js`, {
	totalShards: 'auto',
	shardsPerClusters: 1,
	mode: 'process',
	token: process.env.TOKEN
});

manager.on('clusterCreate', (cluster) => {
	console.log(`Cluster ${cluster.id} has been created`);
});

manager.spawn();
