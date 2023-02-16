import './lib/setup';
import '@sapphire/plugin-hmr/register';

import { MiyuClient } from './lib/structures/MiyuClient';
// import type { SapphireClient } from '@sapphire/framework';
// import { ClusterClient } from 'discord-hybrid-sharding';

const client = new MiyuClient();
// as SapphireClient & { cluster: ClusterClient<SapphireClient> };
// client.cluster = new ClusterClient<SapphireClient>(client);
console.log(client);

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login(process.env.TOKEN);
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
