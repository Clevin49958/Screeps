const {
    BUILDER
} = require("./helper");
const helper = require("./helper");

module.exports = {

    //TOWER CODE
    defendMyRoom: function() {
        for (let roomId in Memory.myRooms) {
            // console.log(roomId)
            room = Game.rooms[roomId];

            var towers = room.find(FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_TOWER
                }
            });
            var hostiles = room.find(FIND_HOSTILE_CREEPS);

            //if there are hostiles - attakc them    
            if (hostiles.length > 0) {
                Memory.states.defending[room] = true;
                var username = hostiles[0].owner.username;
                Game.notify(
                    `User ${username} spotted in room ${room.name}`);
                for (let hostile of hostiles) {
                    var hostile_healer = _.reduce(hostiles, ((acc, c) =>
                            acc ||
                            _.reduce(c.body, (acc, part) => acc || part
                                .type == 'HEAL', undefined) ? c : acc),
                        null);
                    if (towers.length > 0 && (towers[0].pos.inRangeTo(
                            hostile, 16) || !hostile_healer)) {
                        towers.forEach(tower => tower.attack(
                            hostile_healer ? hostile_healer :
                            hostiles[0]));
                        break;
                    }
                }
                console.log("ALERT!!!! WE ARE UNDER ATTACK!!!!! ");
            }

            //if there are no hostiles....
            if (hostiles.length === 0) {
                Memory.states.defending[room] = false;

                if (towers.length == 0) return;
                Memory.creepDemand[room.name][room.name][BUILDER] = room.find(FIND_CONSTRUCTION_SITES).length >
                    0 ? 1 : 0;

                //....first heal any damaged creeps
                for (let name in Game.creeps) {
                    // get the creep object
                    var creep = Game.creeps[name];
                    if (creep.hits < creep.hitsMax) {
                        towers.forEach(tower => tower.heal(creep));
                    }
                }

                for (let tower of towers) {
                    //...repair Buildings! :) But ONLY until 10% the energy of the tower is gone.
                    //Because we don't want to be exposed if something shows up at our door :)
                    if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > ((
                            tower.store.getCapacity(RESOURCE_ENERGY) /
                            10) * 7)) {

                        //Find the closest damaged Structure
                        var closestDamagedStructure = tower.pos
                            .findClosestByRange(FIND_STRUCTURES, {
                                filter: (s) => s.hits < s.hitsMax - 800 && s
                                    .structureType != STRUCTURE_WALL &&
                                    s.structureType != STRUCTURE_RAMPART
                            });
                        if (closestDamagedStructure) {
                            tower.repair(closestDamagedStructure);
                        } else if (Game.time % 10 < 4) {
                            var walls = tower.room.find(FIND_STRUCTURES, {
                                filter: (s) => ((s.structureType ==
                                        STRUCTURE_WALL || s
                                        .structureType ==
                                        STRUCTURE_RAMPART) &&
                                    s.hits < 900000)
                            });
                            var target = undefined;
                            var minHits = 1000000;
                            for (let name in walls) {
                                var wall = walls[name];
                                if (wall.hits < minHits) {
                                    target = wall;
                                    minHits = wall.hits;
                                }
                            }
                            if (target) {
                                tower.repair(target);
                            }
                        }
                    }
                }

            }
        }
    }
}