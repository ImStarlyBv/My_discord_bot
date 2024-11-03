import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'tumalditamadre',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};
const ANIMAL_COMMAND =  {
  "name": "blep",
  "type": 1,
  "description": "Send a random adorable animal photo",
  "options": [
      {
          "name": "animal",
          "description": "The type of animal",
          "type": 3,
          "required": true,
          "choices": [
              {
                  "name": "Dog",
                  "value": "animal_dog"
              },
              {
                  "name": "Cat",
                  "value": "animal_cat"
              },
              {
                  "name": "Penguin",
                  "value": "animal_penguin"
              }
          ]
      },
      {
          "name": "only_smol",
          "description": "Whether to show only baby animals",
          "type": 5,
          "required": false
      }
  ]
};

const PLAY_COMMAND = {
  name: 'play',
  description: 'Play a song in your voice channel',
  options: [
    {
      type: 3,
      name: 'song',
      description: 'The name of the song or a URL',
      required: true,
    },
  ],
  type: 1,
};

const SKIP_COMMAND = {
  name: 'skip',
  description: 'Skip the current song',
  type: 1,
};

const STOP_COMMAND = {
  name: 'stop',
  description: 'Stop the music and clear the queue',
  type: 1,
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, ANIMAL_COMMAND, PLAY_COMMAND, SKIP_COMMAND, STOP_COMMAND];


InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
