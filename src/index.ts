import './lib/setup';
import '@sapphire/plugin-hmr/register';

import { Kazagumo, Plugins } from 'kazagumo';
import { Connectors } from 'shoukaku';
import { MiyuClient } from './lib/structures/MiyuClient';
import spotifyPlugin from 'kazagumo-spotify';
import { container } from '@sapphire/framework';
import type { ColorResolvable } from 'discord.js';
import { Client } from 'genius-lyrics';

const Nodes = [
	{
		name: 'main',
		url: '192.168.1.127:2333',
		auth: 'rawrx3-Fox',
		secure: false
	}
];

const client = new MiyuClient();
const kazagumo = new Kazagumo(
	{
		defaultSearchEngine: 'soundcloud',
		plugins: [
			new Plugins.PlayerMoved(client),
			new spotifyPlugin({
				clientId: process.env.SPOTIFY_CLIENT_ID as string,
				clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
				playlistPageLimit: 1,
				albumPageLimit: 1,
				searchLimit: 10,
				searchMarket: 'US'
			})
		],

		send: (guildId, payload) => {
			const guild = client.guilds.cache.get(guildId);
			if (guild) guild.shard.send(payload);
		}
	},
	new Connectors.DiscordJS(client),
	Nodes,
	{
		resume: true
	}
);

kazagumo.shoukaku.on('ready', (name) => console.log(`Lavalink ${name} is ready`));

kazagumo.shoukaku.on('error', (name, error) => console.warn(`Lavalink ${name} encountered an error: \n ${error}`));

kazagumo.shoukaku.on('disconnect', (name, players, moved) => {
	if (moved) return;
	players.map((player) => player.connection.disconnect());
	console.warn(`Lavalink ${name}: Disconnected`);
});

kazagumo.shoukaku.on('close', (name, code, reason) => console.warn(`Lavalink ${name}: Closed, Code ${code}, Reason ${reason || 'No reason'}`));

const main = async () => {
	try {
		container.embedColor = process.env.EMBED_COLOR as ColorResolvable;
		container.kazagumo = kazagumo;
		container.lyrics = new Client();
		client.logger.info('Logging in');
		await client.login(process.env.TOKEN as string);
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
