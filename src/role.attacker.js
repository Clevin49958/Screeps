const helper = require('./helper');

module.exports = {
  // a function to run the logic for this role
  run: function(creep) {
    if (!creep.memory.working && Game.rooms[creep.memory.target] && Game.rooms[creep.memory.target]
        .find(FIND_HOSTILE_CREEPS).length == 0 && Game.rooms[creep.memory.target]
        .find(FIND_HOSTILE_STRUCTURES).length == 0) {
      // suicide damaged creeps if they can't be healed
      for (const name in Game.creeps) {
        if ({}.hasOwnProperty.call(Game.creeps, name)) {
          const creeper = Game.creeps[name];
          if (
            creeper.memory.target == creep.memory.target &&
              creeper.hits < creeper.hitsMax * 0.7 &&
              (creeper.memory.target != creeper.memory.home ||
                creeper.room.find(
                    FIND_MY_STRUCTURES, {filter: (s) =>
                      s.structureType == STRUCTURE_TOWER}).length == 0
              )) {
            console.log(`${creeper.name} suicided. Reason: damaged; Hits: ${creeper.hits} HitsMax: ${creeper.hitsMax}`);
            Game.notify(
                `${creeper.name} suicided. Reason: damaged; Hits: ${creeper.hits} HitsMax: ${creeper.hitsMax}`,
            );
            creeper.suicide();
          }
        }
      }
      helper.recycle(creep);

      return;
    }

    if (helper.moveTargetRoom(creep)) return true;

    let enermy = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
      filter: (s) => s.structureType == STRUCTURE_TOWER,
    });
    if (!enermy) {
      enermy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
        ignoreDestructibleStructures: true,
      });
    }
    if (!enermy) {
      enermy = creep.pos.findClosestByPath(
          FIND_HOSTILE_STRUCTURES/* , {filter: s => s.structureType != STRUCTURE_STORAGE}*/);
    }

    if (!enermy) {
      creep.memory.working = false;
      return;
    }

    console.log(`${creep.name} Attacking: target: ${JSON.stringify(enermy.pos)}`);
    if (
      Memory.offence[creep.memory.home] &&
        Memory.offence[creep.memory.home][creep.memory.target]
    ) {
      Memory.offence[creep.memory.home][creep.memory.target].quest = enermy.id;
    }

    if (creep.pos.isNearTo(enermy)) {
      creep.attack(enermy);
    } else {
      creep.myMoveTo(enermy);
    }
  },
};
