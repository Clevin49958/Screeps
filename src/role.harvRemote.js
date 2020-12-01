const helper = require("./helper");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        if (!creep.memory.source) {
            creep.memory.source = Game.rooms[creep.memory.target].find(FIND_SOURCES)[creep.memory
                .sourceIndex].id;
        }
        // console.log(creep.name,JSON.stringify(Game.getObjectById(creep.memory.source)))
        var source = Game.getObjectById(creep.memory.source);
        // if arrived
        if (creep.memory.arrived == true) {
            if (creep.store.getCapacity(RESOURCE_ENERGY) > 0 && creep
                .store.getFreeCapacity(RESOURCE_ENERGY) <= 25) {
                var container = creep.pos.findInRange(FIND_STRUCTURES,
                    0, {
                        filter: s => s.structureType ==
                            STRUCTURE_CONTAINER
                    });
                if (container.length > 0) {
                    container = container[0]
                    // var loot = creep.pos.findClosestByRange(
                    //     FIND_DROPPED_RESOURCES);
                    if (container.hits < container.hitsMax * 0.8) {
                        creep.repair(container);
                        return;
                    }
                    // if (loot && creep.pos.isEqualTo(loot) && container
                    //     .store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    //     creep.pickup(loot);
                    // }
                    if (source.energy > 0){
                        creep.harvest(source);
                    }
                    
                } else {
                    container = creep.pos.findClosestByRange(
                        FIND_CONSTRUCTION_SITES);
                    creep.build(container);
                }
            } else {
                creep.harvest(source);
            }
        } else if (creep.pos.isNearTo(source)) {

            var container = creep.pos.findInRange(FIND_STRUCTURES,
                2, {
                    filter: (s) => s.structureType ==
                        STRUCTURE_CONTAINER
                });
            if (container.length == 0) {
                container = creep.pos.findInRange(
                    FIND_CONSTRUCTION_SITES, 2);
            }
            if (container.length == 0) {
                return;
            }
            if (creep.pos.isEqualTo(container[0])) {
                creep.memory.arrived = true;
                creep.harvest(source);
            } else {
                creep.myMoveTo(container[0]);
            }
        } else {
            creep.myMoveTo(source);
        }
    }
};