import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';
import type { MiyuCommand } from '../../lib/structures/Command';

@ApplyOptions<MiyuCommand.Options>({
	description: "Set's the default volume for the bot when a player is created",
	fullCategory: ['Config'],
	usage: '>defaultvolume <volume>',
	examples: ['>defaultvolume 100'],
	preconditions: ['GuildOnly'],
	name: 'volume'
})
export default class DefaultVolumeCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addIntegerOption((option) => option.setName('volume').setDescription('The volume to set the default to').setRequired(false))
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.setDMPermission(false);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const volume = interaction.options.getInteger('volume') ?? null;
		if (!volume) {
			return this.fetchVolume(interaction);
		} else {
			return this.setVolume(interaction, volume);
		}
	}

	private async fetchVolume(interaction: Command.ChatInputCommandInteraction) {
		const { guildId } = interaction;
		const guildSettings = await this.container.db.guild.findUnique({
			where: { guildId: guildId as string }
		});

		return interaction.reply({ content: `The default volume is ${guildSettings?.volume ?? '40'}` });
	}

	private async setVolume(interaction: Command.ChatInputCommandInteraction, volume: number) {
		const { guildId } = interaction;
		const guildSettings = await this.container.db.guild.findUnique({
			where: { guildId: guildId as string }
		});

		if (!guildSettings) {
			await this.container.db.guild.create({
				data: {
					guildId: guildId as string,
					volume: volume
				}
			});
		} else {
			await this.container.db.guild.update({
				where: { guildId: guildId as string },
				data: {
					volume: volume
				}
			});
		}

		return interaction.reply({ content: `Set the default volume to ${volume}` });
	}
}
