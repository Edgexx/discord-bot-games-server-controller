const { SlashCommandBuilder } = require('@discordjs/builders');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('mc-shutdown')
		.setDescription('Shutdown, archive, and delete the virtual private sever for Minecraft. (Est. ~10mins)'),
	async execute(interaction) {

		console.log("Received command to spin down VPS..");
		interaction.deferReply({ ephemeral: true }).then(function(){
			interaction.editReply("Checking for existing VPS :arrows_counterclockwise: ...");
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
				interaction.editReply("No existing VPS :x:");
				return;
			}

			interaction.editReply("Minecraft VPS found :white_check_mark: \nShutting down VPS :arrows_counterclockwise: ...");
			console.log("Shutting down droplet..")
			doClient.droplets.shutdown(dropletID, function(err, shutdown) {
				if(err != null){
					console.log(err);
					interaction.editReply("Minecraft VPS found :white_check_mark: \nError while shutting down :x: ...");
					return;
				}

				sleep(8000).then(() => {
					interaction.editReply("Minecraft VPS found :white_check_mark: \nShutting down VPS :white_check_mark: \nCreating a snapshot (~10mins) :arrows_counterclockwise: ...");
					console.log("Creating snapshot..");
					doClient.droplets.snapshot(dropletID, process.env.SNAPSHOT_NAME, function(err){
						if(err != null){
							console.log(err);
							return;
						}

						sleep(600000).then(() => {

							doClient.snapshots.list().then(function(snapshots){
								var snapshotFound = false;
								for (let i = 0; i < snapshots.length; i++) {
									if (snapshots[i]["name"] == process.env.SNAPSHOT_NAME) {
										snapshotFound = true;
										interaction.editReply("Minecraft VPS found :white_check_mark: \nnShutting down VPS :white_check_mark: \nCreated a snapshot :white_check_mark: \nDeleting VPS :arrows_counterclockwise: ...");
										console.log("Destroying droplet..");
										doClient.droplets.delete(dropletID, function(err, destroy){
											if(err != null){
												console.log(err);
												interaction.editReply("Minecraft VPS found :white_check_mark: \nnShutting down VPS :white_check_mark: \nCreated a snapshot :white_check_mark: \nError destroying VPS :x: ...");
												return;
											}
											interaction.editReply("Minecraft VPS successfully shutdown. :white_check_mark: ");
										});
										break;
									}
								}
								if(snapshotFound == false){
									interaction.editReply("Minecraft VPS found :white_check_mark: \nnShutting down VPS :white_check_mark: \nError while creating a snapshot :x: ...");
								}
							});
						});
					});
				});
			});
		});
	},
};
