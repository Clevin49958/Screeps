const helper = require("./helper")

module.exports = {

    ship: (roomName) => {
        let room = helper.getMemory(['mine', 'links', roomName]);

        // validify room links
        if (!room) {
            return false;
        }
        if (!room.receiver || !room.sender) {
            return false;
        } 

        let receivers = _.values(room.receiver).map(l => Game.getObjectById(l));
        let senders = _.values(room.sender).map(l => Game.getObjectById(l));
        // console.log(receivers,senders);
        receivers = _.filter(receivers, r => r.store.getUsedCapacity(RESOURCE_ENERGY) == 0);
        senders = _.filter(senders, s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && s.cooldown === 0);

        if (receivers.length == 0 || senders.length == 0) {
            return false;
        }

        for (let index = 0; index < _.min([receivers.length, senders.length]); index++) {
            senders[index].transferEnergy(receivers[index]);
        }
    }
}