import 'dotenv/config';
import express from 'express';
import nacl from 'tweetnacl'; // Add this import
import {  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKeyMiddleware, } from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';
import pkg from 'discord-music-player';
const { Player} = pkg;
import { Client, GatewayIntentBits } from 'discord.js'; // Import Discord.js

import bodyParser from 'body-parser';
// const { RepeatMode } = require('discord-music-player');
import Discord from "discord.js";

const client = new Discord.Client({
    // intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates] });
const settings = {
    prefix: '!',
    token: process.env.DISCORD_TOKEN
};

const player = new Player(client, {
  leaveOnEmpty: false, // This options are optional.
});
// You can define the Player as *client.player* to easily access it.
client.player = player;

client.on("ready", () => {
    console.log("I am ready to Play with DMP 🎶");
});

client.login(settings.token);


// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware to parse the raw body as a buffer
app.use(bodyParser.raw({ type: 'application/json' }));
const activeGames = {};
/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using tweetnacl
 */
app.post('/interactions',  async function (req, res) {
  // Get headers and raw body
  
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  const body = req.body.toString('utf8'); // Convert the raw buffer to a string

  // Verify the request
  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, 'hex'),
    Buffer.from(process.env.PUBLIC_KEY, 'hex')
  );

  if (!isVerified) {
    return res.status(401).end("invalid request signature");
  }

  // Interaction type and data
  const juan = JSON.parse(body);

  
  const { type, data } = juan; // Parse the body content
  let guildId = juan["guild_id"]
  console.log(guildId);
  
console.log(juan);

  const mc = type === InteractionType.MESSAGE_COMPONENT;
  
//  type = InteractionType[type];
  /**
   * Handle verification requests
   */
  if (mc) {
    // custom_id set in payload when sending message component
    console.log("tamo aqui");
    
    const componentId = data.custom_id;
    console.log(componentId.startsWith());
    
      if (componentId.startsWith('accept_button_')) {
        // get the associated game ID
        const gameId = componentId.replace('accept_button_', '');
        // Delete message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${juan["token"]}/messages/${juan["message"]["id"]}`;
        try {
         return await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'What is your object of choice?',
              // Indicates it'll be an ephemeral message
              flags: InteractionResponseFlags.EPHEMERAL,
              components: [
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: MessageComponentTypes.STRING_SELECT,
                      // Append game ID
                      custom_id: `select_choice_${gameId}`,
                      options: getShuffledOptions(),
                    },
                  ],
                },
              ],
            },
          });
          // Delete previous message
          await DiscordRequest(endpoint, { method: 'DELETE' });
        } catch (err) {
          console.error('Error sending message:', err);
        }
      } else if (componentId.startsWith('select_choice_')) {
        // get the associated game ID
        console.log("tamo alla");
        
        const gameId = componentId.replace('select_choice_', '');
        console.log("dique game id " + gameId);
        console.log("dique active " + activeGames[0]);
        if (activeGames[gameId]) {
          // Interaction context
          console.log("tamo aculla");
          
          const context = req.body.context;
          // Get user ID and object choice for responding user
          // User ID is in user field for (G)DMs, and member for servers
          const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
          // Calculate result from helper function
          const resultStr = getResult(activeGames[gameId], {
            id: userId,
            objectName,
          });
    
          // Remove game from storage
          delete activeGames[gameId];
          // Update message with token in request body
          const endpoint = `webhooks/${process.env.APP_ID}/${juan["token"]}/messages/${juanp["message"]["id"]}`;
    
          try {
            // Send results
            await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: resultStr },
            });
            // Update ephemeral message
            await DiscordRequest(endpoint, {
              method: 'PATCH',
              body: {
                content: 'Nice choice ' + getRandomEmoji(),
                components: []
              }
            });
          } catch (err) {
            console.error('Error sending message:', err);
          }
        }
      }
    }
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   */
 

  if (type === InteractionType.APPLICATION_COMMAND) {
    
    const  id= juan["member"]["user"]["id"];
    const { name } = data;
    
    if (name === 'play') {
      const voiceChannelId = juan.channel_id;
      if (!voiceChannelId) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'You need to be in a voice channel to play music!',
          },
        });
      }
      
      console.log(guildId);
      
      let queue = player.play(guildId);
      await queue.join(client.channels.cache.get(voiceChannelId));

      let song = await queue.play(args.join(' ')).catch(err => {
        console.log(err);
        if (!guildQueue) queue.stop();
      });

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Playing: ${args.join(' ')}`,
        },
      });
    }

    // Handle the /skip command
    if (name === 'skip') {
      if (!guildQueue) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'No song is currently playing!' },
        });
      }
      guildQueue.skip();
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'Song skipped!' },
      });
    }

    // Handle the /stop command
    if (name === 'stop') {
      if (!guildQueue) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'No song is currently playing!' },
        });
      }
      guildQueue.stop();
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'Music stopped!' },
      });
    }

    
    // "test" command
    if (name === 'test') {
      // Send a message into the channel where the command was triggered
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }  


    
    // "challenge" command
    
  //   if (name === 'challenge' && id!== undefined) {
  //     const ov = juan["data"]["options"][0].value;
  //     // Interaction context
  //     const context = req.body.context;
  //     // User ID is in user field for (G)DMs, and member for servers
  //     const userId = id;
  //     // User's object choice
  //     const objectName = ov;
  
  //     // Create active game using message ID as the game ID
  //     activeGames[id] = {
  //         id: userId,
  //         objectName,
  //     };
  
  //     return res.send({
  //     type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  //     data: {
  //         content: `Rock papers scissors challenge from <@${userId}>`,
  //         components: [
  //         {
  //             type: MessageComponentTypes.ACTION_ROW,
  //             components: [
  //             {
  //                 type: MessageComponentTypes.BUTTON,
  //                 // Append the game ID to use later on
  //                 custom_id: `accept_button_${req.body.id}`,
  //                 label: 'Accept',
  //                 style: ButtonStyleTypes.PRIMARY,
  //             },
  //             ],
  //         },
  //         ],
  //     },
  //     });
  // }


    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});

