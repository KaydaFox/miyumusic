import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: 'Sends the current song to your DMs',
	fullCategory: ['Music'],
	usage: '+save',
	examples: ['+save'],
	preconditions: ['GuildOnly']
})
export class SaveCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setName(this.name).setDescription(this.description).setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.save(interaction);
	}

	private async save(interaction: Command.ChatInputCommandInteraction) {
		const { kazagumo } = this.container;
		const player = kazagumo.players.get(interaction.guildId as string) ?? null;

		if (!player || !player.queue || !player.queue.current) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		const song = player.queue.current;
		if (!song) return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });

		try {
			interaction.user.send({
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() ?? undefined })
						.setTitle(`Saved Song`)
						.setURL(song.uri)
						.setThumbnail(song.thumbnail || null)
						.setDescription(`${song.title} by ${song.author}\n\nRequested by ${song.requester}`)
						.setColor(this.container.embedColor)
						.setTimestamp()
				]
			});

			return interaction.reply({
				ephemeral: true,
				content: `Sent the current song to your DMs!`
			});
		} catch (error) {
			return interaction.reply({
				ephemeral: true,
				content: `I couldn't send the current song to your DMs! Please make sure they are open. Otherwise you can click [here](${
					song.realUri || song.uri
				}) to open the song in your browser.`
			});
		}
	}
}
