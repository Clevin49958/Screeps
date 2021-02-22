import { moveTargetRoom } from "./helper";
import { Logger } from "./Logger";
import { MemoryTree } from "./memoryTree";

module.exports = {
  updateWorkingState: function(creep: Creep) {},

  // a function to run the logic for this role
  run: function(creep: Creep) {
    if (
      // scouting list exist
      !creep.memory.target ||
      Memory.scout?.[creep.memory.home]?.[0] && 
      // target doesn't match scouting list
      creep.memory.target != Memory.scout[creep.memory.home][0]
    ) {
      creep.memory.target = Memory.scout[creep.memory.home][0];
    }

    if (creep.room.name == creep.memory.target) {
      const res = MemoryTree.initRoom(creep.room);
      if (res < OK) {
        Logger.warn(`Record room ${creep.room.name} failed ${res}`);
        Memory.scout[creep.memory.home].splice(0, 1);
        return;
      }
      Memory.scout[creep.memory.home].splice(0, 1);
      // TODO add more rooms to scout
      creep.memory.target = undefined;
    } else {
      moveTargetRoom(creep);
    }
  },
};
