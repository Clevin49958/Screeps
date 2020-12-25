const helper = require('./helper');
const { Logger } = require('./Logger');

module.exports = {
  // a function to run the logic for this role
  run: function(creep) {
    if (!creep.memory.working/*  && Game.rooms[creep.memory.target] && Game.rooms[creep.memory.target]
        .find(FIND_HOSTILE_CREEPS).length == 0 */) {
      // suicide damaged creeps if they can't be healed
      for (const name in Game.creeps) {
        if ({}.hasOwnProperty.call(Game.creeps, name)) {
          const creeper = Game.creeps[name];
          if (
            creeper.memory.target == creep.memory.target &&
              creeper.hits < creeper.hitsMax * 0.7 &&
              (creeper.memory.target != creeper.memory.home ||
                creeper.room.find(FIND_MY_STRUCTURES, {filter: (s) =>
                  s.structureType == STRUCTURE_TOWER,
                }).length == 0
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
    if (creep.memory.heal) {
      if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
      }
    }

    let enermy;
    if (
      Memory.offence[creep.memory.home] &&
        Memory.offence[creep.memory.home][creep.memory.target] &&
        Memory.offence[creep.memory.home][creep.memory.target].quest
    ) {
      enermy = Game.getObjectById(Memory.offence[creep.memory.home][creep.memory.target].quest);
    } else {
      enermy = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_TOWER,
        range: 3,
      });
      if (!enermy) {
        enermy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
          ignoreDestructibleStructures: false,
        });
      }
      if (!enermy) {
        enermy = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
      }
    }

    creep.say(enermy);

    if (!enermy) {
      creep.memory.working = false;
      return;
    }

    Logger.info(`${creep.name} Attacking target: ${JSON.stringify(enermy.pos)}`);

    if (creep.pos.inRangeTo(enermy, 3)) {
      const rampart = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: r =>
        r.structureType == STRUCTURE_RAMPART &&
        r.pos.inRangeTo(creep, 3) &&
        r.pos.inRangeTo(enermy, 3)
      })
      if (rampart) {
        creep.myMoveTo(rampart);
      }
      
      creep.rangedAttack(enermy);
    } else {
      // console.log(
      creep.myMoveTo(enermy, {ignoreStructures: false, range: 3});
    }
  },
};
