const helper = require("./helper");
const roleUpgrader = require("./role.upgrader");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // switch states
        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy ==
            creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            if (helper.moveHome(creep)) {
                let standingAt = creep.room.lookAt(LOOK_STRUCTURES, creep.pos);
                standingAt = _.find(standingAt, s => s.hits < s.hitsMax - 1600);
                if (standingAt) {
                    creep.repair(standingAt);
                }
                return;
            }
            let path = ['mine', 'links', creep.memory.home, 'sender', creep.memory.target];
            let link = helper.getMemory(path);
            link = link ? Game.getObjectById(link) : link;
            // if (creep.name == 'carry-W31N11-W32N11-12') return;
            if (creep.memory.home == creep.room.name && link && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.pos.inRangeTo(link, 5)){
                return helper.payStructure(creep, link);
            }
            helper.payAny(creep);
        }
        // if creep is supposed to harvest energy from source
        else {

            // if in target room
            if (creep.room.name == creep.memory.target) {
                // creep.say('c link')
                if (helper.withdrawLink(creep)) return;
                // creep.say('c loot')
                if (helper.harvestLoot(creep, 500)) return;
                // creep.say('c container');
                if (helper.withdrawContainerIfRich(creep)) return;
                // creep.say('c storage')
                if (helper.withdrawStorage(creep)) return;
                // if (creep.store.getUsedCapacity(RESOURCE_ENERGY)>creep.store.getCapacity(RESOURCE_ENERGY)*0.5){
                //     creep.memory.working = true;
                // } else 
            }
            // if not in target room
            else {
                helper.moveTargetRoom(creep);
            }
        }
    }
}