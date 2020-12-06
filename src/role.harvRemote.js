const helper = require("./helper");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        if (!creep.memory.source){
            if (Game.rooms[creep.memory.target]){
                creep.memory.source = Game.rooms[creep.memory.target].find(FIND_SOURCES)[creep.memory
                    .sourceIndex].id;
            } else {
                helper.moveTargetRoom(creep);
            }
        } 
        // console.log(creep.name,JSON.stringify(Game.getObjectById(creep.memory.source)))
        var source = Game.getObjectById(creep.memory.source);
        // if arrived
        if (creep.memory.arrived == true) {
            // check for presence of link
            if (creep.memory.link === undefined){
                let links = creep.pos.findInRange(FIND_STRUCTURES,
                    1, {filter: s => s.structureType == STRUCTURE_LINK});
                creep.memory.link = (links.length > 0) ? links[0].id : null;
            } 

            if (creep.store.getCapacity(RESOURCE_ENERGY) > 0 && creep
                .store.getFreeCapacity(RESOURCE_ENERGY) <= 10) {
                let container = creep.pos.findInRange(FIND_STRUCTURES,
                    0, {
                        filter: s => s.structureType ==
                            STRUCTURE_CONTAINER
                    });
                if (container.length > 0) {
                    container = container[0]
                    // var loot = creep.pos.findClosestByRange(
                    //     FIND_DROPPED_RESOURCES);
                    if (container.hits < container.hitsMax * 0.99) {
                        creep.repair(container);
                        return;
                    }
                    // if (loot && creep.pos.isEqualTo(loot) && container
                    //     .store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    //     creep.pickup(loot);
                    // }
                    if (creep.memory.link && Game.getObjectById(creep.memory.link).store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        return creep.transfer(Game.getObjectById(creep.memory.link), RESOURCE_ENERGY);
                    }
                    
                    if (source.energy > 0){
                        creep.harvest(source);
                        Memory.states.rich[container.id] = container.store.getFreeCapacity(RESOURCE_ENERGY) <= helper.POOR_THRESHOLD
                    }
                    
                } else {
                    container = creep.pos.findClosestByPath(
                        FIND_CONSTRUCTION_SITES);
                    creep.build(container);
                }
            } else {
                creep.harvest(source);
            }
        } else if (creep.pos.inRangeTo(source, 2)) {

            var container = creep.pos.findInRange(FIND_STRUCTURES,
                4, {
                    filter: (s) => s.structureType ==
                        STRUCTURE_CONTAINER
                });
            if (container.length == 0) {
                container = creep.pos.findInRange(
                    FIND_CONSTRUCTION_SITES, 4, {filter: s => s.structureType == STRUCTURE_CONTAINER});
            }
            if (container.length == 0) {
                if (!creep.pos.isNearTo(source)) {
                    return creep.myMoveTo(source);
                }
                creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                container = creep.pos.findInRange(
                    FIND_CONSTRUCTION_SITES, 4, {filter: s => s.structureType == STRUCTURE_CONTAINER});
            }
            if (creep.pos.isEqualTo(container[0])) {
                creep.say(container[0].pos.x + ' ' + container[0].pos.y)
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