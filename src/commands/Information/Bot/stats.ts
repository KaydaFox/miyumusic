import { ApplyOptions } from '@sapphire/decorators';
import { Command, version } from '@sapphire/framework';
import type { MiyuCommand } from '../../../lib/structures/Command';
import { EmbedBuilder, Guild, Message } from 'discord.js';
import { getInfo } from 'discord-hybrid-sharding';
import { reply } from '@sapphire/plugin-editable-commands';
import type Discord from 'discord.js';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Get some basic stats about the bot',
	fullCategory: ['Information'],
	usage: '>stats',
	examples: ['>stats'],
	enabled: true
})
export class StatsCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public async messageRun(message: Message) {
		return this.sendStats(message);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendStats(interaction);
	}

	private async fetchUsersAndGuils() {
		const { client } = this.container;

		const totalGuildCount: number[] = await client.cluster.broadcastEval('this.guilds.cache.reduce((prev, guild) => prev + 1, 0)');
		const totalMemberCount: number[] = await client.cluster.broadcastEval(
			'this.guilds.cache.reduce((prev, guild) => prev + guild.memberCount, 0)'
		);

		return await Promise.all([totalGuildCount, totalMemberCount]);
	}

	private async sendStats(interactionOrMessage: Message | Command.ChatInputCommandInteraction, guild: Guild | null = null) {
		const { client } = this.container;
		const [totalGuildCount, totalMemberCount] = await this.fetchUsersAndGuils();

		const shardId = guild ? guild.shardId : 0;
		const clusterId = getInfo().CLUSTER;
		const totalShards = getInfo().TOTAL_SHARDS;
		const totalClusters = getInfo().CLUSTER_COUNT;
		const botCpuUsage = Math.round(process.cpuUsage().user / 1024 / 1024);

		const embed = new EmbedBuilder()
			.setTitle('Bot Stats')
			.setThumbnail(client.user?.displayAvatarURL() as string)
			.addFields(
				{
					name: 'General',
					value: `**Servers:** ${totalGuildCount}\n**Users:** ${totalMemberCount}`,
					inline: true
				},
				{
					name: 'Bot',
					value: `**JS:** v${version}\n**Runtime:** ${process.version}\n**Uptime:** <t:${Math.round(
						client.readyTimestamp || Date.now() / 1000
					)}:R>\n**CPU Usage:** ${botCpuUsage}%`,
					inline: true
				},
				{
					name: 'Other',
					value: `**Shard:** ${shardId}/${totalShards}\n**Cluster:** ${clusterId}/${totalClusters}`
				}
			)
			.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable)
			.setFooter({
				text: `© StarnightFox - 2022 • Shard #${shardId | 0}`,
				iconURL: `https://cdn.discordapp.com/avatars/717329527696785408/653266c08f010ff73ff230d72a5d5279.webp?size=128`
			});

		if (interactionOrMessage instanceof Message) {
			return reply(interactionOrMessage, { embeds: [embed] });
		}

		return interactionOrMessage.reply({ embeds: [embed] });
	}
}
