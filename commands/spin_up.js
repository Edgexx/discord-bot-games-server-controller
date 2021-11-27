const { SlashCommandBuilder } = require('@discordjs/builders');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('mc-startup')
		.setDescription('Starts up the virtual private server for Minecraft. (Est. ~2mins)'),
	async execute(interaction) {

		console.log("Received command to spin up VPS..");
		interaction.deferReply({ ephemeral: true }).then(function(){
			interaction.editReply("Checking for existing VPS :arrows_counterclockwise: ...");
		});

		var doClient = digitalocean.client(process.env.DO_TOKEN);
		var existingDropletFound = false;

		// Check for existing droplet
		console.log("Fetching droplets list..")
		doClient.droplets.list().then(function(droplets){
			console.log("Checking for an existing droplet..")
			for (let i = 0; i < droplets.length; i++) {
				if (droplets[i]["name"] == process.env.SNAPSHOT_NAME) {
					existingDropletFound = true;
					console.log("Existing droplet found!")
					break;
				}
			}
			if (existingDropletFound){
				interaction.editReply("Existing VPS found :warning: Check status via /mc-server-status");
				return;
			}else{
				console.log("No existing droplets found..")
				interaction.editReply("No existing VPS :white_check_mark: \nAquiring snapshot :arrows_counterclockwise: ...");
			}
		}).then(function(){

			if (existingDropletFound){
				console.log("Existing droplet found, breaking out of command!");
				return;
			}

			// Get all images
			var imageID;
			console.log("Fetching snapshots..")
			doClient.snapshots.list().then(function(snapshots){
				for (let i = 0; i < snapshots.length; i++) {
					// Get correct image by "name"
					if (snapshots[i]["name"] == "minecraft-server") {
						imageID = snapshots[i]["id"];
						break;
					}
				}
			}).then(function(){
				console.log("Snapshot ID: " + imageID);
				if(imageID == null){
					console.log("Could not find snapshot. Existing command!");
					return;
				}
				interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshot :white_check_mark: \nSpinning up VPS (~2mins) :arrows_counterclockwise: ...");

				// Create new droplet from image
				var dropletOptions = {
				    "name": "minecraft-server",
				    "region": "sfo3",
				    "size": "s-2vcpu-2gb-intel",
				    "image": imageID,
					"backups": false,
					"ipv6": false,
					"monitoring": true
				}
				var newDropletID;
				console.log("Creating new droplet from snapshot..");
				doClient.droplets.create(dropletOptions, function(err, droplet){
					if(err != null)
					{
						console.log(err);
						interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshop :white_check_mark: \nError initiating VPS spin up :warning:");
						return;
					}
					newDropletID = droplet["id"];
					var status;
					//interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshop :white_check_mark: \nSpinning up VPS :white_check_mark: \nAssigning Floating IP :arrows_counterclockwise: ...");

					// Wait for droplet creation to complete
					console.log("Sleeping for 2mins...");
					sleep(120000).then(() => {
						console.log("Fetching droplet..");
						doClient.droplets.get(newDropletID, function(err, droplet){
							status = droplet["status"];
							console.log("Droplet Status: " + status);

							if (status != "active") {
								interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshop :white_check_mark: \nSpinning up timeout :warning:");
								return;
							}

							interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshop :white_check_mark: \nSpinning up VPS :white_check_mark: \nAssiging Floating IP :arrows_counterclockwise:");
							// Assign the floating IP to new droplet
							doClient.floatingIps.assign(process.env.FLOATING_IP, newDropletID, function(err){
								if(err != null)
								{
									console.log(err);
									interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshop :white_check_mark: \nSpinning up VPS :white_check_mark: \nError while assigning Floating IP :warning:");
									return;
								}
								interaction.editReply("No existing VPS :white_check_mark: \nAquired snapshop :white_check_mark: \nSpinning up VPS :white_check_mark: \nAssigned Floating IP :white_check_mark:");

								sleep(3000).then(() => {
									interaction.editReply("VPS spin up complete. :white_check_mark: Minecraft Server should be available soon via IP Address: **" + process.env.FLOATING_IP + "**");
								});
							}).then(function(){
								//Delete image
								doClient.snapshots.delete(imageID, function(err){
									if(err != null){
										console.log(err);
									}
									console.log("Deleted old snapshot.");
								});
							});
						});
					});
				});
			});
		});
	},
};
