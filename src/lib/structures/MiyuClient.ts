import { LogLevel, SapphireClient } from '@sapphire/framework';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { GatewayIntentBits, Partials } from 'discord.js';

export class MiyuClient extends SapphireClient {
	// public cluster: ClusterClient<SapphireClient>;

	public constructor() {
		super({
			defaultPrefix: '+',
			regexPrefix: /^(hey +)?(miyu|miyuchan|miyu-chan)[,! ]/i,
			caseInsensitivePrefixes: true,
			caseInsensitiveCommands: true,
			logger: {
				level: LogLevel.Debug
			},
			shards: getInfo().SHARD_LIST,
			shardCount: getInfo().TOTAL_SHARDS,
			intents: [
				GatewayIntentBits.DirectMessageReactions,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildEmojisAndStickers,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.MessageContent
			],
			typing: true,
			partials: [Partials.Channel],
			loadMessageCommandListeners: true,
			hmr: {
				enabled: true
			},
			presence: {
				status: 'idle'
			},
			api: {
				automaticallyConnect: false
			}
		});
		this.cluster = new ClusterClient<SapphireClient>(this);
	}
}

declare module '@sapphire/framework' {
	interface SapphireClient {
		cluster: ClusterClient<SapphireClient>;
	}
}
