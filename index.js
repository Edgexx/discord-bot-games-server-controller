const Discord = require("discord.js");
const config = require("./config.json");
const { Client, Intents } = require('discord.js');

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILD_MESSAGES);

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES] });
const prefix = "!";

client.on("message", function(message){
	if(message.author.bot) return;
	if(!message.content.startsWith(prefix)) return;

	const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  }
  
});

client.login(config.BOT_TOKEN);