const helper = require('./helper');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        if (!creep.memory.working && Game.rooms[creep.memory.target]
            .find(FIND_HOSTILE_CREEPS).length == 0) {
            helper.recycle(creep);
            return;
        }

        if (helper.moveTargetRoom(creep)) return true;

        var enermy = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, 
            {filter: s => s.structureType == STRUCTURE_TOWER, range:3}
        );
        if (!enermy) {
            enermy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {ignoreDestructibleStructures: true});
        }
        if (!enermy) {
            enermy = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
        }
        
        console.log(`target: ${JSON.stringify(enermy)}`)
        if (!enermy) {
            creep.memory.working = false;
            var spawn = Game.getObjectById(Memory.mySpawns[creep.room
                .name]);
            if (creep.pos.isNearTo(spawn)) {
                
                // suicide damaged creeps if they can't be healed
                for (let name in Game.creeps){
                    var creeper = Game.creeps[name];
                    if (creeper.memory.target == creep.memory.target && creeper.hits < creeper.hitsMax *0.7 &&
                        creeper.memory.target != creeper.memory.home){
                            Game.notify(`${creeper.name} suicided. Reason: damaged; Hits: ${creeper.hits} HitsMax: ${creeper.hitsMax}`)
                            creeper.suicide();
                        }
                }
                spawn.recycleCreep(creep);
            } else creep.myMoveTo(spawn);

            return;
        }

        if (creep.pos.inRangeTo(enermy, 3)) {
            var ramparts = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
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
            creep.myMoveTo(enermy, {range:3});
        }
    }
};