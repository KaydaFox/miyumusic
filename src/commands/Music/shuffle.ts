import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Shuffle the queue',
	fullCategory: ['Music'],
	usage: '+shuffle',
	examples: ['+shuffle'],
	preconditions: ['GuildOnly']
})
export class ShuffleCommand extends MiyuCommand {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description).setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.shuffle(interaction);
	}

	private async shuffle(interaction: Command.ChatInputCommandInteraction) {
		const { kazagumo } = this.container;
		const player = kazagumo.players.get(interaction.guildId as string) ?? null;

		if (!player) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const queue = player.queue;
		if (!queue || !queue.length) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		if (queue.length < 2) return interaction.reply({ content: 'Not enough songs in the queue', ephemeral: true });

		await queue.shuffle();

		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() ?? undefined })
					.setDescription(`Shuffled the queue`)
					.setColor(this.container.embedColor)
					.setTimestamp()
			]
		});
	}
}
