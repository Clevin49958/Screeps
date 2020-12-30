const {Logger} = require('./Logger');
/* eslint-disable no-unused-vars */

/**
 * @typedef defaultRoomCreepConfig.config
 * @type {object.<string,number>}
 * @property {number} harvester=0
 * @property {number} harvRemote
 * @property {number} hauler
 * @property {number} harvester
 * @property {number} upgrader
 * @property {number} builder
 * @property {number} repairer
 * @property {number} wallRepairer
 * @property {number} claimer
 */

/**
 * default room configuration
 * @param {string} room room name
 * @param {boolean} owner whether the room will be claimed/reserved
 * @returns {defaultRoomCreepConfig.config} room config obj
 */
function defaultRoomCreepConfig(room, owner = false) {
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
 * @param {defaultRoomCreepConfig.config} [demands] a specfic room config in format of roomCreepConfig
 */
function addControlledRoom(controlled, room, demands = null) {
  demands = _.merge(defaultRoomCreepConfig(controlled), demands);

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
  creepTrack[room][room] = defaultRoomCreepConfig(room, true);
  const creepDemand = Memory.creepDemand;
  creepDemand[room] = {
    [room]: defaultRoomCreepConfig(room, true),
  };
}

/**
 * @callback parseObjectProperties.parse
 * @param {*} obj
 * @param {string} k
 */
/**
 * parse the object recursively
 * @param {*} obj the object
 * @param {parseObjectProperties.parse} parser parser
 */
function parseObjectProperties(obj, parser) {
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      parseObjectProperties(obj[k], parser);
    } else if (Object.hasOwnProperty.call(obj, k)) {
      parser(obj, k);
    }
  }
}
/**
 * Get the ownership status of controller
 * @param {StructureController?} controller
 * @returns {boolean|number|string|Array.<string>} one of the following status:
 *
 * true: my claimed room
 *
 * 0: neutral without controller
 *
 * 1: neutral with controller
 *
 * string: hostile owner/reserver's username
 *
 * array: my reserved room, array lists nearby claimed rooms
 */
function getControllerStatus(controller) {
  let res;
  if (controller) {
    if (controller.my) {
      res = true;
    } else if (controller.owner) {
      res = controller.owner.username;
    } else {
      if (controller.reservation) {
        if (controller.reservation.username === Memory.userName) {
          // my reserved room
          const nearbyRooms = _.values(Game.map.describeExits(controller.room.name));
          res = [];
          nearbyRooms.forEach((roomName) => {
            if (_.get(Game, ['rooms', roomName, 'controller', 'my'])) {
              res.push(roomName);
            }
          });
        } else {
          res = controller.reservation.username;
        }
      } else {
        res = 1;
      }
    }
  } else {
    res = 0;
  }
  return res;
}

/**
 * update owner in Memory.rooms[room]
 * @param {Room} room
 * @returns {number} ERR_* / OK
 */
function updateOwner(room) {
  const mem = Memory.rooms[room.name];
  if (!room) {
    return ERR_NOT_FOUND;
  } else {
    mem.owner = getControllerStatus(room.controller);
    return OK;
  }
}

/**
 * return an object containing id, x, y info of the room object
 * @param {RoomObject} s structure
 * @returns {{id: string, x: number, y: number}} the detail of room object
 */
const basicInfo = (s) => ({
  id: s.id,
  x: s.pos.x,
  y: s.pos.y,
});

/**
 * return an object containing id, x, y, structureType info of the structure
 * @param {AnyStructure} s structure
 * @returns {{id: string, x: number, y: number, structureType: number}} the detail of structure
 */
const structureInfo = (s) => ({
  id: s.id,
  structureType: s.structureType,
  x: s.pos.x,
  y: s.pos.y,
});

/**
 * check if the structure is at base and handled by a keeper
 * by checking the presence of a flag named keeper-${roomName} nearby
 * @param {AnyStructure} s the structure to check
 * @returns {boolean}
 */
const isAtBase = (s) => {
  return s.pos.findInRange(FIND_FLAGS, 1, {
    filter: (f) =>
      f.name == `keeper-${s.room.name}`,
  }).length > 0;
};

/**
 * Update section
 *  - structures
 *  - ramparts
 * 
 * in Memory.rooms
 * @param {Room} room
 * @param {number} [findConstant=FIND_MY_STRUCTURES] 
 * the find constant used for room.find,
 * replace by FIND_STRUCTURES to reuse results when finding walls/roads
 */
function updateOwnedStructures(room, findConstant = FIND_MY_STRUCTURES) {
  const mem = Memory.rooms[room.name];
  mem.strctures = [];
  mem.ramparts = [];
  if (findConstant != FIND_MY_STRUCTURES && findConstant != FIND_STRUCTURES) {
    findConstant = FIND_STRUCTURES;
  }

  for (const structure of room.find(findConstant)) {
    const info = structureInfo(structure);
    switch (structure.structureType) {
      case STRUCTURE_RAMPART:
        mem.ramparts.push(basicInfo(structure));
        continue;

      case STRUCTURE_LINK:
        // TODO: change Link mechanics to node chains instead of sender/receiver type
        if (structure.pos.findInRange(FIND_FLAGS, 1, {
          filter: (f) =>
            f.name == `keeper-${structure.room.name}`,
        }).length > 0) {
          info.type = 'receiver';
        } else {
          info.type = 'sender';
        }
        if (isAtBase(structure)) {
          info.isAtBase = 1;
        }
        break;

      case STRUCTURE_LAB:
        _.assign(info, {
          type: 'off',
          srcType: null,
          react: 0,
          rectors: null,
        });
        break;

      case STRUCTURE_STORAGE:

      case STRUCTURE_SPAWN:

      case STRUCTURE_TOWER:

      case STRUCTURE_POWER_SPAWN:
        if (isAtBase(structure)) {
          info.isAtBase = 1;
        }

      default:
        break;
    }

    mem.strctures.push(info);
  }
}

/**
 * Update section
 *  - walls
 *  - roads
 * in Memory.rooms
 * @param {Room} room
 */
function updateInfrasctructures(room) {
  const mem = Memory.rooms[room.name];
  mem.walls = [];  
  mem.roads = [];
  for (const structure of room.find(FIND_STRUCTURES)) {
    switch (structure.structureType) {
      case STRUCTURE_ROAD:
        mem.roads.push(basicInfo(structure));
        break;
    
      case STRUCTURE_WALL:
        mem.walls.push(basicInfo(structure));
        break;

      default:
        break;
    }
  }
}

/**
 *
 * @param {Room} room
 * @returns {number} ERR_* / OK
 */
function initRoomInMemory(room) {
  if (!room) {
    return ERR_NOT_FOUND;
  }

  _.set(Memory, ['rooms', room.name], {});
  const mem = room.memory;

  // sources
  mem.sources = room.find(FIND_SOURCES).map((s) => s.id);

  // mineral
  const mineral = room.find(FIND_MINERALS)[0];
  mem.mineral = {
    id: mineral.id,
    type: mineral.mineralType,
    density: mineral.density,
  };

  // owner
  updateOwner(room);

  // structures
  updateOwnedStructures(room, FIND_STRUCTURES);
  updateInfrasctructures(room);

  // set update timer
  mem.lastUpdate = Game.time;
  return OK;
}

/**
 * Update section
 *  - owner
 *  - structures
 *  - infrastructures
 *   - walls
 *   - roads
 *   - ramparts
 * 
 * in Memory.rooms
 * @param {Room} room
 * @returns ERR_* / OK
 */
function updateRoomInMemory(room) {
  if (!_.get(room, 'memory.lastUpdate')) {
    return initRoomInMemory(room);
  }
  let res = OK;
  res = updateOwner(room) || res;
  res = updateOwnedStructures(room, FIND_STRUCTURES) || res;
  res = updateInfrasctructures(room) || res;
  // set update timer
  room.memory.lastUpdate = Game.time;
  return res;
}

/**
 * cycle through all visible rooms and update next room every PERIOD ticks 
 */
function autoUpdateRoom() {
  const PERIOD = 100;
  // prevent too much expensive execution on the same tick remainder
  const REMAINDER = 1;
  if (Game.time % PERIOD == REMAINDER) {
    const roomNames = _.keys(Game.rooms);
    const index = (Game.time - REMAINDER) % (PERIOD * roomNames.length) / PERIOD;
    updateRoomInMemory(Game.rooms[roomNames[index]]);
  }
}

/**
 * Initialise Memory.rooms section base on ```initRoomInMemory```
 */
function initMemoryTree() {
  if (!_.get(Memory, 'init.initMemoryTree')) {
    const startTime = Game.cpu.getUsed();
    for (const roomName of _.keys(Game.rooms)) {
      initRoomInMemory(Game.rooms[roomName]);
    }
    _.set(Memory, 'init.initMemoryTree', true);
    Logger.info(`Memory initiation completed using ${Game.cpu.getUsed() - startTime} ms`);
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
  alter: () => {},

  /**
     * manual control,
     * trigger by setting Memory.exec = true
     *
     * Memory.exec = Game. time when executed succesfully
     */
  alterOnce: () => {
    // Memory.init.exec = 0;s
    if (Memory.exec === true) {
      // addOwnerRoom('W36N9');
      // addControlledRoom('W34N13', 'W33N12')
      // transferControlledRoom('W34N13', 'W33N12', 'W34N12')
      // removeControlledRoom('W34N13','W34N12')
      Logger.info(`Executed once @${Game.time}`);
      Memory.exec = Game.time;
    }
  },

  initMemoryTree,
  initRoomInMemory,
  autoUpdateRoom,
};
