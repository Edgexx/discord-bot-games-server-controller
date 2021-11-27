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

		console.log("Received command to check VPS status..");
		interaction.deferReply({ ephemeral: true }).then(function(){
			interaction.editReply("Searching for existing VPS :arrows_counterclockwise: ...");
		});

		var doClient = digitalocean.client(process.env.DO_TOKEN);
		var existingDropletFound = false;
		var dropletID;
		// Check for existing droplet
		console.log("Fetching droplets list..")
		doClient.droplets.list().then(function(droplets){
			console.log("Checking for and existing droplet..")
			for (let i = 0; i < droplets.length; i++) {
				if (droplets[i]["name"] == process.env.SNAPSHOT_NAME) {
					existingDropletFound = true;
					dropletID = droplets[i]["id"];
					console.log("Existing droplet found!")
					break;
				}
			}
		}).then(function(){
			if (existingDropletFound == false){
				console.log("No existing droplets found.. Exiting command..")
				interaction.editReply("The VPS current status:  Offline  :red_circle:");
				return;
			}

			interaction.editReply("Searching for existing VPS :white_check_mark: \nCheck VPS status :arrows_counterclockwise: ...");

			doClient.droplets.get(dropletID,  function(err, droplet) {
				if(err != null){
					console.log(err);
					return;
				}
				if (droplet.status === "active") {
					interaction.reply(`The VPS current status:  Active  :green_circle:  IP Address: **${process.env.FLOATING_IP}**`);
				}
			});
		});
	},
};
