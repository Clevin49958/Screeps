const { Logger } = require('./Logger');
const { BasicInfo, StructureInfo } = require ('./globalClasses');
const { isAtBase } = require('./globalTree');
const { addOwnerRoom } = require('./init')
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
 * Update section
 *  - structures
 *  - ramparts
 *
 * in Memory.rooms
 * @param {Room} room
 * @param {number} [findConstant=FIND_MY_STRUCTURES]
 * the find constant used for room.find,
 * replace by FIND_STRUCTURES to reuse results for finding walls/roads
 */
function updateOwnedStructures(room, findConstant = FIND_MY_STRUCTURES) {
  const mem = Memory.rooms[room.name];
  mem.structures = [];
  mem.ramparts = [];
  if (findConstant != FIND_MY_STRUCTURES && findConstant != FIND_STRUCTURES) {
    findConstant = FIND_STRUCTURES;
  }

  for (const structure of room.find(findConstant)) {
    const info = StructureInfo.fromStruc(structure);
    switch (structure.structureType) {
      case STRUCTURE_RAMPART:
        mem.ramparts.push(BasicInfo.fromObj(structure));
        continue;

      case STRUCTURE_ROAD:
      case STRUCTURE_WALL:
        continue;

      case STRUCTURE_LINK:
        // TODO: change Link mechanics to node chains instead of sender/receiver type
        if (structure.pos.findInRange(FIND_FLAGS, 1, {
          filter: (f) => f.name == `keeper-${structure.room.name}`,
        }).length > 0) {
          info.type = 'receiver';
        } else {
          info.type = 'sender';
        }
        if (isAtBase(structure.pos)) {
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
        if (isAtBase(structure.pos)) {
          info.isAtBase = 1;
        }

      default:
        break;
    }

    mem.structures.push(info);
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
        mem.roads.push(BasicInfo.fromObj(structure));
        break;

      case STRUCTURE_WALL:
        mem.walls.push(BasicInfo.fromObj(structure));
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
function initRoom(room) {
  if (!room) {
    return ERR_NOT_FOUND;
  }

  _.set(Memory, ['rooms', room.name], {});
  const mem = room.memory;

  // sources
  mem.sources = room.find(FIND_SOURCES).map((s) => new BasicInfo(s.id, )) || [];

  // mineral
  const mineral = room.find(FIND_MINERALS)[0];
  mem.mineral = mineral ? {
    id: mineral.id,
    type: mineral.mineralType,
    density: mineral.density,
  } : null;

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
function updateRoom(room) {
  if (!_.get(room, 'memory.lastUpdate')) {
    return initRoom(room);
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
  const PERIOD = 50;
  // prevent too much expensive execution on the same tick remainder
  const REMAINDER = 1;
  if (Game.time % PERIOD == REMAINDER) {
    const roomNames = _.keys(Game.rooms);
    const index = (Game.time - REMAINDER) % (PERIOD * roomNames.length) / PERIOD;
    updateRoom(Game.rooms[roomNames[index]]);
  }
}

function preInit() {
  if (!_.get(Memory, 'states.init.preInitMemoryTree')) {
    const startTime = Game.cpu.getUsed();
    Memory.sources = {};
    Memory.offence = {};
    Memory.creepDemand = {};
    Memory.stats = {
      creepTrack: {}
    };
    Memory.states = {
      restart: {},
      defending: {}
    };
    Memory.myRooms = {};
    for (const roomName in Game.rooms) {
      if (Object.hasOwnProperty.call(Game.rooms, roomName)) {
        const room = Game.rooms[roomName];
        Memory.sources[roomName] = room.find(FIND_SOURCES).length;
        addOwnerRoom(roomName);
      }
    }
    _.set(Memory, 'states.init.preInitMemoryTree', true);
  }
}

/**
 * Initialise Memory.rooms section base on ```initRoom```
 */
function init() {
  if (!_.get(Memory, 'states.init.initMemoryTree')) {
    const startTime = Game.cpu.getUsed();
    for (const roomName of _.keys(Game.rooms)) {
      initRoom(Game.rooms[roomName]);
    }
    _.set(Memory, 'states.init.initMemoryTree', true);
    Logger.info(`Memory initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
  } else {
    let startTime = Game.cpu.getUsed();
    for (const roomName of _.keys(Game.rooms)) {
      if (!Memory.rooms[roomName]) {
        initRoom(Game.rooms[roomName]);
        Logger.info(`Memory superaddition of ${roomName} using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
        startTime = Game.cpu.getUsed();
      }
    }
    _.set(Memory, 'states.init.initMemoryTree', true);
  }
}

module.exports = {
    autoUpdateRoom,
    preInit,
    init,
    initRoom,
    getControllerStatus,
    updateInfrasctructures,
    updateOwnedStructures,
    updateOwner,
    updateRoom,
}