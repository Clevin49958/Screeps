const {
    UPGRADER
} = require("./helper");
const helper = require("./helper");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        creep.say(UPGRADER.slice(0, 1))
        if (creep.memory.target && creep.room.name != creep.memory
            .target) {
            helper.moveTargetRoom(creep);
            return;
        }
        // if creep is bringing energy to the controller but has no energy left
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

        // if creep is supposed to transfer energy to the controller
        if (creep.memory.working == true) {
            // instead of upgraderController we could also use:
            // if (creep.transfer(creep.room.controller, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

            // try to upgrade the controller
            if (creep.upgradeController(creep.room.controller) ==
                ERR_NOT_IN_RANGE) {
                // if not in range, move towards the controller
                creep.myMoveTo(creep.room.controller);
            }

            if (!creep.room.controller.my) {
                const target = creep.pos.findClosestByRange(
                    FIND_STRUCTURES, {
                        filter: s => s.structureType ==
                            STRUCTURE_SPAWN || s.structureType ==
                            STRUCTURE_EXTENSION
                    });
                if (target) {
                    if (creep.dismantle(target) == ERR_NOT_IN_RANGE) {
                        creep.myMoveTo(target);
                    }
                }
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            if (creep.memory.target && creep.room.name != creep.memory
                .target) {
                helper.moveTargetRoom(creep);
                return;
            }
            if (helper.harvestLoot(creep)) return;
            if (helper.withdrawEnergy(creep)) return;
        }
    }
};