const helper = require('./helper');
const {Logger} = require('./Logger');
/* eslint-disable no-unused-vars */

/**
 * default room configuration
 * @param {string} room room name
 * @param {boolean} owner whether the room will be claimed/reserved
 * @returns {Object} room config obj
 */
function roomCreepConfig(room, owner = false) {
  return {
    harvester: 0,
    harvRemote: Memory.sources[room],
    hauler: Memory.sources[room],
    upgrader: owner ? 1 : 0,
    builder: 0,
    repairer: 0,
    wallRepairer: 0,
    claimer: owner ? 0 : 1,
  };
}

/**
 * add controlled room to room (for remote harvesting and defending purposes)
 * @param {string} controlled room name
 * @param {string} room room name
 * @param {Object.<string, number>} [demands] a specfic room config in format of roomCreepConfig
 */
function addControlledRoom(controlled, room, demands = null) {
  if (!demands) {
    demands = roomCreepConfig(controlled);
  }
  if (!Memory.myRooms[room].includes(controlled)) {
    Memory.myRooms[room].push(controlled);
  }
  
  Memory.creepDemand[room][controlled] = demands;
  Memory.stats.creepTrack[room][controlled] = {};
}

/**
 * remove controlled room from room
 * @param {string} controlled room name
 * @param {string} room room name
 * @returns {Object.<string, number>} [demands] a specfic room config in format of roomCreepConfig
 */
function removeControlledRoom(controlled, room) {
  Memory.myRooms[room].splice(Memory.myRooms[room].findIndex((r) => r == controlled), 1);
  const demands = Memory.creepDemand[room][controlled];
  Memory.creepDemand[room][controlled] = undefined;
  return demands;
}

/**
 * transfer control of room from old owner to new owner
 * @param {string} room transfered room
 * @param {string} oldOwner original owner room name
 * @param {string} newOwner new owner room name
 */
function transferControlledRoom(room, oldOwner, newOwner) {
  addControlledRoom(room, newOwner, demands = removeControlledRoom(room,
      oldOwner));
}


/**
 * add freshly claimed room
 * @param {string} room name
 */
function addOwnerRoom(room) {
  Memory.myRooms[room] = [room];
  const creepTrack = Memory.stats.creepTrack;
  creepTrack[room] = {};
  creepTrack[room][room] = roomCreepConfig(room, true);
  const creepDemand = Memory.creepDemand;
  creepDemand[room] = {
    [room]: roomCreepConfig(room, true),
  };
}

function parseObjectProperties (obj, parse) {
  for (var k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      parseObjectProperties(obj[k], parse)
    } else if (Object.hasOwnProperty.call(obj, k)) {
      parse(obj, k)
    }
  }
}

module.exports = {
  /**
   * TODO: verify
   * @deprecated
   */
  minCreeps: () => {
    for (const spawnName in Game.spawns) {
      // if ({}.hasOwnProperty.call(Game.spawns, spawnName)) {
      const spawn = Game.spawns[spawnName];
      if (!spawn.memory.init) {
        spawn.memory.init = {};
      }

      // if (true){
      if (!spawn.memory.init.minCreeps) {
        // current room config
        spawn.memory[spawn.room.name] = {
          // harvester:0,
          // hauler:0,
          harvRemote: Memory.sources[Game.spawns[
              spawnName].room.name],
          hauler: Memory.sources[Game.spawns[spawnName]
              .room.name],
          upgrader: 1,
          builder: 1,
          repairer: 0,
          wallRepairer: 0,
        };

        // remote harv room config
        for (const id in Memory.myRooms[spawn.room.name]) {
          // if ({}.hasOwnProperty.call(Memory.myRooms[spawn.room.name], id)) {
          const roomName = Memory.myRooms[spawn.room.name][id];
          spawn.memory[roomName] = {
            // harvester:0,
            // hauler:0,
            harvRemote: Memory.sources[roomName],
            hauler: Memory.sources[roomName],
            upgrader: 0,
            builder: 1,
            repairer: 0,
            wallRepairer: 0,
          };
          // }
        }
        spawn.memory.init.minCreeps = true;
      }
      // }
    }
  },

  /**
   * manual control
   */
  alter: () => {
  },

  /**
   * manual control,
   * trigger by setting Memory.exec = true
   *
   * Memory.exec = Game. time when executed succesfully
   */
  alterOnce: () => {
    // Memory.init.exec = 0;s
    if (Memory.exec === true) {

      // creepDemand = Memory.creepDemand;
      // creepTrack = Memory.stats.creepTrack;
      // global.creepDemand = creepDemand;
      // global.creepTrack = creepTrack;

      // parseObjectProperties(Memory, (obj, k) => {
      //   if (obj[k] == 'carry') {
      //     obj[k] = 'hauler'
      //   }
      // })

      // addOwnerRoom('W36N9');
      // addControlledRoom('W34N13', 'W33N12')
      // transferControlledRoom('W34N13', 'W34N12', 'W33N12')
      Logger.info(`Executed once @${Game.time}`);
      Memory.exec = Game.time;
    }
  },
};
