const { SlashCommandBuilder } = require('@discordjs/builders');
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('mc-server-status')
		.setDescription('Get the current status of the VPS.'),
	async execute(interaction) {
		var doClient = digitalocean.client(process.env.DO_TOKEN);
		doClient.droplets.get(process.env.DROPLET_ID,  function(err, droplet) {
			console.log(err); // null on success
			console.log(droplet.status); //
			var status = ":red_circle:";
			if (droplet.status === "active") {
				status = ":green_circle:";
			}
			interaction.reply(`The VPS current status:  ${droplet.status}  ${status}`);
		});
	},
};
