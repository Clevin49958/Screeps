const { HARV_REMOTE, HARVESTER } = require("./helper");
const helper = require("./helper");
const roleUpgrader = require("./role.upgrader");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        creep.say(HARVESTER.slice(0,1));
        // if creep is bringing energy to the spawn or an extension but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to the spawn or an extension
        if (creep.memory.working == true) {
            helper.payAny(creep);
        }
        // if creep is supposed to harvest energy from source
        else {
            if (Memory.states.restart){
                if (helper.withdrawContainer(creep)) return;
            }
            helper.harvest(creep);
        }
    }
};