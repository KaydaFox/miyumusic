import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import type { TextChannel, VoiceChannel } from 'discord.js';
import { Events, KazagumoPlayer, PlayerMovedChannels, PlayerMovedState } from 'kazagumo';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.kazagumo,
	event: Events.PlayerMoved
})
export class PlayerMovedListener extends Listener<typeof Events.PlayerMoved> {
	public async run(player: KazagumoPlayer, state: PlayerMovedState, channels: PlayerMovedChannels) {
		const guildSettings = await this.container.db.guild.findUnique({ where: { guildId: player.guildId } });

		if (state === 'LEFT') {
			return player.destroy();
		} else if (state === 'MOVED') {
			if (!channels.newChannelId) return;

			await player.setVoiceChannel(channels.newChannelId);

			if (guildSettings?.bindToVC) {
				const oldChannel = (await this.container.client.channels.fetch(player.textId)) as TextChannel | VoiceChannel;

				player.setTextChannel(channels.newChannelId);

				if (!oldChannel) return;
				oldChannel.send({ content: `My output has been moved to <#${channels.newChannelId}> as i have moved VCs` });
			}
		}

		return;
	}
}
