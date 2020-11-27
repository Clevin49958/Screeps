const helper = require("./helper");
const roleUpgrader = require("./role.upgrader");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {

        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }
        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            // if in home room
            if (creep.room.name == creep.memory.home) {
                helper.payAny(creep);
            }
            // if not in home room...
            else {
                // find exit to home room
                helper.moveHome(creep);
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            
            // if in target room
            if (creep.room.name == creep.memory.target) {
                // creep.say('c loot')
                // if (helper.harvestLoot(creep)) return;
                // creep.say('c container')
                if (helper.withdrawContainerIfRich(creep)) return;
                // creep.say('c storage')
                if (helper.withdrawStorage(creep)) return;
                // if (creep.store.getUsedCapacity(RESOURCE_ENERGY)>creep.store.getCapacity(RESOURCE_ENERGY)*0.5){
                //     creep.memory.working = true;
                // } else 
                helper.moveRand(creep);
            }
            // if not in target room
            else {
                helper.moveTargetRoom(creep);
            }
        }
    }
};