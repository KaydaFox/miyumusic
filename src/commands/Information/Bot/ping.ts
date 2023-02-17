import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import type { MiyuCommand } from '../../../lib/structures/Command';
import type Discord from 'discord.js';
import { codeBlock } from '@sapphire/utilities';
import { reply } from '@sapphire/plugin-editable-commands';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Displays the bot and API latency',
	fullCategory: ['General'],
	usage: '>ping',
	examples: ['>ping']
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public async messageRun(message: Message) {
		return this.sendPing(message);
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendPing(interaction);
	}

	private async sendPing(interactionOrMessage: Message | Command.ChatInputCommandInteraction) {
		const initialEmbed = new EmbedBuilder().setDescription('Pinging...').setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable);

		const pingMessage =
			interactionOrMessage instanceof Message
				? await reply(interactionOrMessage, { embeds: [initialEmbed] })
				: await interactionOrMessage.reply({ embeds: [initialEmbed], fetchReply: true });

		const finalEmbed = new EmbedBuilder()
			.addFields(
				{
					name: 'Bot Latency',
					value: `${codeBlock('ini', `[ ${this.container.client.ws.ping}ms ]`)}`,
					inline: true
				},
				{
					name: 'API Latency',
					value: `${codeBlock('ini', `[ ${pingMessage.createdTimestamp - interactionOrMessage.createdTimestamp}ms ]`)}`,
					inline: true
				}
			)
			.setColor(process.env.EMBED_COLOUR as Discord.ColorResolvable);

		if (interactionOrMessage instanceof Message) {
			return pingMessage.edit({ embeds: [finalEmbed] });
		}

		return interactionOrMessage.editReply({
			embeds: [finalEmbed]
		});
	}
}