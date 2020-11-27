const helper = require("./helper");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // if arrived
        if (creep.memory.arrived == true) {
            if (creep.store.getCapacity(RESOURCE_ENERGY) > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 25) {
                var container = creep.pos.findInRange(FIND_STRUCTURES, 0, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                });
                if (container.length > 0) {
                    container = container[0]
                    var loot = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
                    if (container.hits < container.hitsMax * 0.8) {
                        creep.repair(container);
                        return;
                    }
                    if (loot && creep.pos.isEqualTo(loot) && container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        creep.pickup(loot);
                    }
                    var source = creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];
                    creep.harvest(source)
                } else {
                    container = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                    creep.build(container);
                }
            } else {
                if (loot && creep.pos.isEqualTo(loot) && container.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    creep.pickup(loot);
                    return;
                }
                var source = creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];
                creep.harvest(source)
            }
        } else if (creep.room.name == creep.memory.target) {
            // in the room, not arrived
            var source = creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];
            if (creep.pos.isNearTo(source)) {

                var container = creep.pos.findInRange(FIND_STRUCTURES, 2, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER
                });
                if (container.length == 0) {
                    container = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 2);
                }
                if (container.length == 0) {
                    return;
                }
                if (creep.pos.isEqualTo(container[0])) {
                    creep.memory.arrived = true;
                    creep.harvest(source);
                } else {
                    creep.moveTo(container[0]);
                }
            } else {
                const target = creep.pos.findInRange(FIND_STRUCTURES, 100, {
                    filter: (s) => s.structureType == STRUCTURE_WALL && s.pos.y == 17 && s.pos.x == 2
                });
                if (creep.memory.target == 'W31N11' && target.length > 0) {
                    if (creep.dismantle(target[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target[0]);
                    }
                } else {
                    creep.moveTo(source);
                }
            }
        } else {
            helper.moveTargetRoom(creep);
        }
    }
};