const helper = require('./helper');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        if (!creep.memory.working && Game.rooms[creep.memory.target]
            .find(FIND_HOSTILE_CREEPS).length == 0) {
            helper.recycle(creep);
            return;
        }

        if (creep.memory.target && creep.memory.target != creep.room
            .name) {
            helper.moveTargetRoom(creep);
            return;
        }

        var enermy = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
        if (!enermy) {
            enermy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        }
        if (!enermy) {
            creep.memory.working = false;
            var spawn = Game.getObjectById(Memory.mySpawns[creep.room
                .name]);
            if (creep.pos.isNearTo(spawn)) {
                spawn.recycleCreep(creep);
            } else creep.myMoveTo(spawn);

            return;
        }

        if (creep.pos.inRangeTo(enermy, 3)) {
            var ramparts = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: s => s.structureType ==
                    STRUCTURE_RAMPART
            });
            if (ramparts.length > 0) {
                if (_.reduce(ramparts, (acc, r) => (acc || r.pos
                        .isEqualTo(creep.pos)), false)) {
                    creep.rangedAttack(enermy);
                } else {
                    ramparts.forEach(rampart => {
                        if (rampart.inRangeTo(enermy, 3)) {
                            creep.myMoveTo(rampart);
                            return;
                        }
                    });
                }
            } else {
                creep.rangedAttack(enermy);
            }
        } else {
            creep.myMoveTo(enermy);
        }
    }
};