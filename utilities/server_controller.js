const digitalocean = require('digitalocean');
const dotenv = require('dotenv');
dotenv.config();
const doClient = digitalocean.client(process.env.DO_TOKEN);

module.exports = {

    async GetDroplet(dropletName){

		var droplet;

		console.log("Fetching droplets list..");
        const droplets = await doClient.droplets.list();

        console.log(`Acquired list (length: ${droplets.length})\n Checking for and existing droplet: ${dropletName}..`);

        for (let i = 0; i < droplets.length; i++) {
            if (droplets[i]["name"] == dropletName) {
                droplet = droplets[i];
                break;
            }
        }

        console.log(`Droplet found: ${droplet != null}`);
        return droplet;
    },

    async GetSnapshot(snapshotName){

        var snapshot;

        console.log("Fetching snapshots..");
        const snapshots = await doClient.snapshots.list();

        console.log(`Acquired snapshots (length: ${snapshots.length})\n Checking for an existing snapshot: ${snapshotName}..`);

        for (let i = 0; i < snapshots.length; i++) {
            if (snapshots[i]["name"] == snapshotName) {
                snapshot = snapshots[i];
                break;
            }
        }

        console.log(`Snapshot found: ${snapshot != null}`);
        return snapshot;
    },

    async CreateDroplet(dropletOptions){

        console.log("Creating new droplet from snapshot..");
        var succeeded = true;
        const newDroplet = await doClient.droplets.create(dropletOptions).catch(function(err) {
          console.error(err);
          succeeded = false;
        });;

        console.log(`Created: ${succeeded}`);
        return newDroplet;
    },

    async AssignFloatingIp(floatingIp, dropletId){

        console.log("Assigning Floating IP...");
        var succeeded = true;
        await doClient.floatingIps.assign(floatingIp, dropletId).catch(
            function(err){
                console.error(err);
                succeeded = false;
            }
        );

        console.log(`Assigned: ${succeeded}`);
        return succeeded;
    },

    async DeleteSnapshot(snapshotId){

        console.log("Deleting old snapshot...");
        var succeeded = true;
        await doClient.snapshots.delete(snapshotId).catch(
            function(err){
                console.error(err);
                succeeded = false;
            }
        );

        console.log(`Deleted: ${succeeded}`);
        return succeeded;
    },

    async ShutdownDroplet(dropletId){

        console.log(`Shutting down droplet (id: ${dropletId})...`);
        var succeeded = true;
        await doClient.droplets.shutdown(dropletId).catch(
            function(err){
                console.error(err);
                succeeded = false;
            }
        );

        return succeeded;
    },

    async CreateSnapshot(dropletId, snapshotName){

        console.log(`Creating snapshot (dropletId: ${dropletId}), snapshotName: ${snapshotName})...`);
        const snapshot = doClient.droplets.snapshot(dropletId, snapshotName).catch(
            function(err){
                console.error(err);
            }
        );

        console.log(`Created: ${(snapshot != null)}`);
        return snapshot;
    },

    async DeleteDroplet(dropletId){

        console.log(`Destroying droplet (id: ${dropletId})...`);
        var succeeded = true;
        await doClient.droplets.delete(dropletId).catch(
            function(err){
                console.error(err);
                succeeded = false;
            }
        );

        return succeeded;
    },

    GetPublicIp(droplet){

        var ipAddress;

        for (var i = 0; i < droplet["networks"]["v4"].length; i++) {
            if (droplet["networks"]["v4"][i]["type"] == "public") {
                ipAddress = droplet["networks"]["v4"][i]["ip_address"];
            }
        }

        return ipAddress;
    },

    async GetDomainRecords(){
        console.log(`Retreiving domain records for droplet ${process.env.DO_DOMAIN}...`);
        const domainRecords = await doClient.domains.listRecords(process.env.DO_DOMAIN);
        return domainRecords;
    },

    async UpdateDomainRecord(recordId, ipAddress){
        const attributes = {
            "type": "A",
            "data": ipAddress
        }
        const response = await doClient.domains.updateRecord(process.env.DO_DOMAIN, recordId, attributes);
        return response;
    },

};

module.exports.icons = {
    online      : "Online  :green_circle:",
    offline     : "Offline  :red_circle:",
    loading     : ":arrows_counterclockwise:",
    success     : ":white_check_mark:",
    warning     : ":warning:"
};
