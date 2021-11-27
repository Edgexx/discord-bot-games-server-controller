const { SlashCommandBuilder } = require('@discordjs/builders');
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('mc-server-off')
		.setDescription('Auto-saves, then turns OFF the virtual server.'),
	async execute(interaction) {
		
		// Get all droplets
		// Find correct droplet by "name"
		// Shutdown droplet
		// Create an image of the droplet, using specific name

		var doClient = digitalocean.client(process.env.DO_TOKEN);
		doClient.droplets.shutdown(process.env.DROPLET_ID, function(err, shutdown) {
			console.log(err); // null on success
			console.log(shutdown); //
		});
		interaction.reply("The VPS is shutting down!  :red_circle: ");
	},
};
