const {Logger} = require('./Logger');

module.exports = {
  preparePerTick: () => {
    // detect storage, replace with container if present
    for (const roomName of _.keys(Memory.myRooms)) {
      const room = Game.rooms[roomName];
      if(!room) continue;
      const alternativeStorage = room.memory.alternativeStorage;
      const globalMem = global.rooms[room.name];
      globalMem.storage = room.storage;
      if (_.isEmpty(room.storage)) {
        if (alternativeStorage) {
          globalMem.storage = Game.getObjectById(alternativeStorage);
          if (!globalMem.storage) {
            room.memory.alternativeStorage = undefined;
          }
        }
        if (alternativeStorage ===  undefined) {
          const containers = room.controller.pos.findInRange(FIND_STRUCTURES, 4, {filter: 
            s => s.structureType == STRUCTURE_CONTAINER
          });
          if (containers.length > 0) {
            room.memory.alternativeStorage = containers[0].id;
            globalMem.storage = containers[0];
          }
        } 
      } else if (alternativeStorage !== undefined) {
        delete room.memory.alternativeStorage;
      }
    }
    
  },

  preInit: () => {
    if (Memory.exec === true) {
      Memory.exec = -1
    }
  },

  postInit: () => {
    if (Memory.exec === -1) {
      Memory.exec = -2;
    }
  },

  postSetup: ()=> {
    if (Memory.exec === -2) {
      
      Logger.info(`Exec completed @${Game.time}.`);
      Memory.exec = Game.time;
    }
  }
};