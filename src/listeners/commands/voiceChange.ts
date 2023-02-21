import { ApplyOptions } from '@sapphire/decorators';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { container, Events, Listener } from '@sapphire/framework';
import type { VoiceChannel, VoiceState } from 'discord.js';

@ApplyOptions<Listener.Options>({
	once: false,
	emitter: container.client,
	event: Events.VoiceStateUpdate
})
export class VoiceStateUpdateListener extends Listener<typeof Events.VoiceStateUpdate> {
	public async run(oldState: VoiceState, newState: VoiceState) {
		const player = await container.kazagumo.players.get(oldState.guild.id || newState.guild.id);
		if (!player) return;

		const channel = (await this.container.client.channels.fetch(player.voiceId!)) as VoiceChannel;
		if (!channel) return;

		const membersInVC = channel.members.filter((member) => !member.user.bot).size;

		let textChannel = await this.container.client.channels.fetch(player.textId);
		if (!textChannel || !isTextBasedChannel(textChannel)) textChannel = channel;

		if (!membersInVC || membersInVC <= 0) {
			if (player.playing && !player.paused) {
				console.log('pause');
				player.pause(true);
				return textChannel.send({ content: 'Paused the player as i was left alone' });
			}
		} else {
			if (player.paused) {
				console.log('resume');
				player.pause(false);
				return textChannel.send({ content: 'Resumed the player as someone joined' });
			}
		}

		return;
	}
}
