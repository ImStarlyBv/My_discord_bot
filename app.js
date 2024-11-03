import 'dotenv/config';
import express from 'express';
import nacl from 'tweetnacl';
import { Player } from 'discord-player';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import bodyParser from 'body-parser';
import { Client, GatewayIntentBits } from 'discord.js';

// Create an express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse the raw body as a buffer
app.use(bodyParser.raw({ type: 'application/json' }));

// Discord Client Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize the Player instance for music
const player = new Player(client);
client.player = player; // Attach the player to the client

// Register YoutubeiExtractor for YouTube playback
player.extractors.register(YoutubeiExtractor, {});

// Player event listener for when a track starts
player.events.on('playerStart', (queue, track) => {
  queue.metadata.channel.send(`Started playing **${track.title}**!`);
});

// Interactions endpoint
app.post('/interactions', async (req, res) => {
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  const body = req.body.toString('utf8');

  // Verify the signature
  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, 'hex'),
    Buffer.from(process.env.PUBLIC_KEY, 'hex')
  );

  if (!isVerified) {
    return res.status(401).send("Invalid request signature");
  }

  const interaction = JSON.parse(body);
  const { type, data } = interaction;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const name = data.name;

    if (name === 'play') {
      let query = data.options[0].value;
      query = query.toLowerCase()
      if (query.includes("alfa")) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Error: no voy a reproducir esa mierda manito :face_vomiting: ` }
        });

      }
      const guildId = interaction.guild_id;
      const guild = await client.guilds.cache.get(guildId);
      const member = await guild.members.fetch(interaction.member.user.id);
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'You need to be in a voice channel to play music!' }
        });
      }

      const queue = await client.player.nodes.create(guildId, { metadata: { channel: voiceChannel } });

      if (!queue.connection) await queue.connect(voiceChannel);

      try {
        const result = await queue.play(query);
        const trackTitle = result.tracks[0]?.title || query;

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Now playing: **${trackTitle}**!` }
        });
      } catch (e) {
        console.error('Error playing track:', e);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Error: ${e.message}` }
        });
      }
    }

    if (name === 'pause') {
      const guildId = interaction.guild_id;
      const queue = client.player.nodes.get(guildId);

      if (!queue || !queue.node.isPlaying()) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'No music is currently playing!' }
        });
      }

      queue.node.pause();
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'Music paused!' }
      });
    }

    if (name === 'skip') {
      const guildId = interaction.guild_id;
      const queue = client.player.nodes.get(guildId);

      if (!queue || !queue.node.isPlaying()) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'No music is currently playing!' }
        });
      }

      queue.node.skip();
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'Song skipped!' }
      });
    }
  }

  return res.status(400).json({ error: 'Unknown command or interaction type' });
});

// Event listener for bot readiness
client.once('ready', () => {
  console.log('Discord client ready!');
});

// Log into Discord
client.login(process.env.DISCORD_TOKEN);

// Start the express server
app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
