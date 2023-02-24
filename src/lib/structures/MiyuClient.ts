import { PrismaClient } from '@prisma/client';
import { container, LogLevel, SapphireClient } from '@sapphire/framework';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import type { Kazagumo } from 'kazagumo';
import { ColorResolvable, GatewayIntentBits, Partials } from 'discord.js';
import type Genius from 'genius-lyrics';

export class MiyuClient extends SapphireClient {
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
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
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

	public override async login(token: string) {
		container.db = new PrismaClient();
		await container.db.$connect().then(() => container.logger.info('Connected to database'));
		return super.login(token);
	}

	public override async destroy() {
		await container.db.$disconnect();
		return super.destroy();
	}
}

declare module '@sapphire/framework' {
	interface SapphireClient {
		cluster: ClusterClient<SapphireClient>;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		db: PrismaClient;
		kazagumo: Kazagumo;
		embedColor: ColorResolvable;
		lyrics: Genius.Client;
	}
}
