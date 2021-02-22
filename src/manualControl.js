const {Logger, wrapColor} = require('./Logger');
const { PayTask } = require('./payTask');
/* eslint-disable no-unused-vars */

/** 
 * @deprecated
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
 * @deprecated
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
 * @deprecated
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
 * @deprecated
 * remove controlled room from room
 * @param {string} controlled room name
 * @param {string} room room name
 * @returns {Object.<string, number>} [demands] a specfic room config in format of roomCreepConfig
 */
function removeControlledRoom(controlled, room) {
  Memory.myRooms[room].splice(Memory.myRooms[room].findIndex((r) => r == controlled), 1);
  const demands = Memory.creepDemand[room][controlled];
  delete Memory.creepDemand[room][controlled];
  return demands;
}

/** 
 * @deprecated
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
 * @deprecated
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
 * @deprecated
 * @callback parseObjectProperties.parse
 * @param {*} obj
 * @param {string} k
 */
/** 
 * @deprecated
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

module.exports = {
  addControlledRoom,
  addOwnerRoom,
  removeControlledRoom,
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
      Memory.exec = ERR_TIRED;
    }
  },

  postInit: () => {
    if (Memory.exec === ERR_TIRED) {
      Memory.exec = Game.time;
    }
  },

  /** 
   * @deprecated
     * manual control
     */
  alter: () => {
  },

  /** 
   * @deprecated
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

      // const tick = 31877900;
      // if (Game.time == tick) {
      //   const roomName = 'E48S45';

      //   const mem = global.rooms[roomName];
      //   const objs = mem.objs;
      //   const id = '60019146d84fa7cdf98cd8ea';
      //   const elem = objs[id];
      //   const task = new PayTask(
      //     5,
      //     RESOURCE_ENERGY,
      //     50000,
      //     elem,
      //     roomName,
      //     elem.isAtBase
      //   ); 
      //   /** @deprecated @type {PayTask} */
      //   global.a = task;
      // }

      // if (Game.time == tick + 5) {

      //   /** @deprecated @type {PayTask} */
      //   const newTask = global.a.clone();
      //   global.b = newTask;
        
      //   /** @deprecated @type {PayTask} */
      //   global.a;
      //   Logger.info(wrapColor('green', `alter once: `))
      //   Logger.info(global.a.alternativeId, global.a);
      //   Logger.info(global.b.alternativeId, global.b);
      //   Memory.config.pause - true;
      // Logger.info(`Executed once @${Game.time}`);
      // Memory.exec = Game.time;
      // }
      

      /* Logger.info(Object.getOwnPropertyNames(task).length, Object.getOwnPropertyNames(task), '\n',
        Object.getOwnPropertyNames(clonedTask).length, Object.getOwnPropertyNames(clonedTask)); */

      Logger.info(`Executed once @${Game.time}`);
      Memory.exec = Game.time;
    }
  },
};