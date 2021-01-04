const {
  REPAIRER,
} = require('./helper');
const helper = require('./helper');
const roleWallRepairer = require('./role.wallRepairer');

module.exports = {
  updateWorkingState: function(creep) {
    // if creep is trying to complete a constructionSite but has no energy left
    if (creep.memory.working == true && creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      // switch state
      creep.memory.working = false;
    } else if (creep.memory.working == false && creep.store.getUsedCapacity(RESOURCE_ENERGY) ==
      creep.store.getCapacity(RESOURCE_ENERGY)) {
      // if creep is harvesting energy but is full
      // switch state
      creep.memory.working = true;
      findQuest(creep);
    }
  },

  // a function to run the logic for this role
  run: function(creep) {
    creep.say(REPAIRER.slice(0, 1));

    if (helper.moveTargetRoom(creep)) {
      return;
    }
    // if creep is supposed to repair something
    if (creep.memory.working == true) {
      // find closest structure with less than max hits
      // Exclude walls because they have way too many max hits and would keep
      // our repairers busy forever. We have to find a solution for that later.
      const structure = creep.pos.findClosestByPath(
          FIND_STRUCTURES, {
            // the second argument for findClosestByPath is an object which takes
            // a property called filter which can be a function
            // we use the arrow operator to define it
            filter: (s) => s.hits < s.hitsMax - 800 && s
                .structureType != STRUCTURE_WALL && s
                .structureType != STRUCTURE_RAMPART,
          });

      // if we find one
      if (structure != undefined) {
        // try to repair it, if it is out of range
        if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
          // move towards it
          creep.myMoveTo(structure);
        }
      } else {
        // if we can't fine one
        // look for construction sites
        roleWallRepairer.run(creep);
      }
    } else {
      // if creep is supposed to harvest energy from source

      // find closest source
      if (helper.harvestLoot(creep)) return;
      if (helper.withdrawEnergy(creep)) return;
      // helper.harvest(creep);
    }
  },
};
