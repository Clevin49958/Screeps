require('./task')
const {PriorityQueue} = require('./priorityQueue')

const { Logger } = require("./Logger");

/**
 * @typedef basicInfo.info
 * @type {{id: string, x: number, y: number}}
 */
/**
 * @typedef structureInfo.info
 * @type {{id: string, x: number, y: number, structureType: number}}
 */

/**
 * Initialise global.rooms section base on ```initRoom```
 */
function init() {
  if (!_.get(global, 'states.init.initGlobalTree')) {
    const startTime = Game.cpu.getUsed();
    for (const roomName of _.keys(Game.rooms)) {
      initRoom(Game.rooms[roomName]);
    }
    _.set(global, 'states.init.initGlobalTree', Game.time);
    Logger.info(`global var initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
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

  _.set(global, ['rooms', room.name], {});
  const globalMem = global.rooms[room.name];
  /** @type {{sources: basicInfo.info[], structures: structureInfo.info[]}} */
  const mem = room.memory;
  globalMem.objs = {};

  // sources
  for (const info of mem.sources) {
    globalMem.objs[info.id] = {
      x: info.x,
      y: info.y,
      type: LOOK_SOURCES
    };
  }

  /** @type {structureInfo.info} */
  // structures
  for (const info of mem.structures) {
    globalMem.objs[info.id] = {
      x: info.x,
      y: info.y,
      type: info.structureType,
      isAtBase: isAtBase(new RoomPosition(info.x, info.y, room.name))
    };
  }

  globalMem.takeQueue = new PriorityQueue();
  globalMem.payQueue = new PriorityQueue();
  globalMem.spawnQueue = new PriorityQueue();
}

function updateRoomInGlobal(roomName) {

}

/**
 * return an object containing id, x, y info of the room object
 * @param {RoomObject} s structure
 * @returns {basicInfo.info} the detail of room object
 */
const basicInfo = (s) => ({
  id: s.id,
  x: s.pos.x,
  y: s.pos.y,
});
/**
 * return an object containing id, x, y, structureType info of the structure
 * @param {AnyStructure} s structure
 * @returns {structureInfo.info} the detail of structure
 */
const structureInfo = (s) => ({
  id: s.id,
  structureType: s.structureType,
  x: s.pos.x,
  y: s.pos.y,
});
/**
 * check if the position is at base and handled by a keeper
 * by checking the presence of a flag named keeper-${roomName} nearby
 * @param {RoomPosition} pos the position to check
 * @returns {boolean}
 */
const isAtBase = (pos) => {
  return pos.findInRange(FIND_FLAGS, 1, {
    filter: (f) => f.name == `keeper-${pos.roomName}`,
  }).length > 0;
};

module.exports = {
  basicInfo,
  structureInfo,
  init,
  initRoom,
  isAtBase,
}