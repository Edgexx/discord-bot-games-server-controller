const { SlashCommandBuilder } = require('@discordjs/builders');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
// https://www.npmjs.com/package/digitalocean
const digitalocean = require('digitalocean');
const dotenv = require('dotenv');
const controller = require('../utilities/server_controller');

dotenv.config();

module.exports = {

	data: new SlashCommandBuilder()
		.setName('mc-shutdown')
		.setDescription('Shutdown, archive, and delete the virtual private sever for Minecraft. (Est. ~10mins)'),

	async execute(interaction) {

		console.log("Received command to spin down VPS..");

		const status_findingVps = "Finding Minecraft VPS...";
		const status_vpsStatus = "Minecraft VPS Status...";
		const status_shuttingDown = "Shutting down Minecraft VPS...";
		const status_creatingSnapshot = "Creating a snapshot of the server (~10mins)...";
		const status_deleteDroplet = "Deleting the Minecraft VPS...";

		interaction.deferReply({ ephemeral: true }).then(
			function(){
				interaction.editReply(`${status_findingVps} ${controller.icons.loading}`);
			}
		);

		const droplet = await controller.GetDroplet(process.env.MC_SNAPSHOT_NAME);

		if (droplet == null) {
			console.log("No droplet found. Exiting command!");
			interaction.editReply(`${status_findingVps} ${controller.icons.warning}`);
			return;
		}

		interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_shuttingDown} ${controller.icons.loading}`);

		const shutdown = await controller.ShutdownDroplet(droplet["id"]);

		if (!shutdown) {
			interaction.editReply(`${status_findingVps} ${controller.icons.success}\nError while shutting down :x: ...`);
			return;
		}

		console.log("Sleeping for 8secs...");
		await sleep(8000);

		//create snapshot
		interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_shuttingDown} ${controller.icons.success}\n${status_creatingSnapshot} ${controller.icons.loading}`);
		const newSnapshot = await controller.CreateSnapshot(droplet["id"], process.env.MC_SNAPSHOT_NAME);

		//wait 5mins, then check every 20secs if snapshot is There
		console.log("Sleeping for 5mins...");
		await sleep(300000);

		var noSnapshot = true;
		var totalWaitTime = 300000;
		do {
			const snapshot = controller.GetSnapshot(process.env.MC_SNAPSHOT_NAME);

			if(snapshot != null){
				noSnapshot = false;
				console.log("Snapshot found!..");
			}
			else{
				console.log("Snapshot not found, checking again in 20secs...");
				await sleep(20000);
				totalWaitTime += 20000;
			}
			if (totalWaitTime >= 1200000) {
				console.error("Timed-out while waiting for snapshot to be created...");
				interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_shuttingDown} ${controller.icons.success}\n${status_creatingSnapshot} ${controller.icons.warning}`);
				return;
			}
		} while (noSnapshot);

		//destory droplet
		interaction.editReply(`${status_findingVps} ${controller.icons.success}\n${status_shuttingDown} ${controller.icons.success}\n${status_creatingSnapshot} ${controller.icons.success}\n${status_deleteDroplet} ${controller.icons.loading}`);
		const deleted = await controller.DeleteDroplet(droplet["id"]);

		if (deleted){
			interaction.editReply(`Minecraft VPS successfully shutdown. ${controller.icons.success}`);
		}
	},
};
