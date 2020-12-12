require('./helper');
const {Logger} = require('./Logger');

module.exports = {

  // TOWER CODE
  defendMyRoom: function() {
    for (const roomName in Memory.myRooms) {
      // if ({}.hasOwnProperty.call(Memory.myRooms, roomName)) {
      // console.log(roomName)
      room = Game.rooms[roomName];

      const towers = room.find(FIND_MY_STRUCTURES, {
        filter: {
          structureType: STRUCTURE_TOWER,
        },
      });
      const hostiles = room.find(FIND_HOSTILE_CREEPS);

      // if there are hostiles - attakc them
      if (hostiles.length > 0) {
        Memory.states.defending[room.name] = true;
        const username = hostiles[0].owner.username;
        const hostileHealer = _.reduce(hostiles, ((acc, c) => acc ||
            _.reduce(c.body, (acc, part) => acc || part.type == 'HEAL', undefined) ? c : acc),
        null);
        if (towers.length > 0 && (towers[0].pos.inRangeTo(hostiles[0], 16) || !hostileHealer)) {
          towers.forEach((tower) => tower.attack(
                            hostileHealer ? hostileHealer :
                            hostiles[0]));
          break;
        }
        if (username != 'Invader' || hostileHealer) {
          Logger.warn(`${roomId} is under attack by ${username} with ${hostiles.length} creeps, healer: ${hostileHealer}`);
        }
      }

      // if there are no hostiles....
      if (hostiles.length === 0) {
        Memory.states.defending[room.name] = false;

        if (towers.length == 0) return;

        // ....first heal any damaged creeps
        for (const name in Game.creeps) {
          // if ({}.hasOwnProperty.call(Game.creeps, name)) {
          // get the creep object
          const creep = Game.creeps[name];
          if (creep.hits < creep.hitsMax) {
            towers.forEach((tower) => tower.heal(creep));
          }
          // }
        }

        for (const tower of towers) {
          // ...repair Buildings! untl certain energy limit
          // Because we don't want to be exposed if something shows up
          if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > ((
            tower.store.getCapacity(RESOURCE_ENERGY) / 10) * 7)) {
            // Find the closest damaged Structure
            const closestDamagedStructure = tower.pos
                .findClosestByRange(FIND_STRUCTURES, {
                  filter: (s) => s.hits < s.hitsMax - 1600 && s
                      .structureType != STRUCTURE_WALL &&
                                      s.structureType != STRUCTURE_RAMPART,
                });
            if (closestDamagedStructure) {
              tower.repair(closestDamagedStructure);
            } else if (Game.time % 10 < 2) {
              const walls = tower.room.find(FIND_STRUCTURES, {
                filter: (s) => ((s.structureType ==
                                          STRUCTURE_WALL || s
                    .structureType ==
                                          STRUCTURE_RAMPART) &&
                                      s.hits < 300000 && s.pos.inRangeTo(tower, 25)),
              });
              let target = undefined;
              let minHits = 1000000;
              for (const name in walls) {
                // if ({}.hasOwnProperty.call(walls, name)) {
                const wall = walls[name];
                if (wall.hits < minHits) {
                  target = wall;
                  minHits = wall.hits;
                }
                // }
              }
              if (target) {
                tower.repair(target);
              }
            }
          }
        }
      }
    }
    // }
  },
};
