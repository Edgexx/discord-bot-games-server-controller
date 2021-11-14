const { SlashCommandBuilder } = require('@discordjs/builders');
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('mc-server-on')
		.setDescription('Turns on the virtual server. (Takes ~30s)'),
	async execute(interaction) {
		var doClient = digitalocean.client(process.env.DO_TOKEN);
		doClient.droplets.powerOn(process.env.DROPLET_ID, function(err, powerOn) {
			console.log(err); // null on success
			console.log(powerOn); //
			if (powerOn.status == 'in-progress') {
				doClient.droplets.get(process.env.DROPLET_ID,  function(err, droplet) {
					interaction.reply(`The VPS is starting up!  :green_circle:  IP Address: **${droplet.networks.v4[0].ip_address}**`);
				});
			}
		});
	},
};
