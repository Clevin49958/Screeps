const { TaskQueue, TakeTask, PayTask, Task } = require('./task')
const { Logger } = require("./Logger");
const { HAULER } = require('./helper');

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
 * 
 * Initialise global.creeps as ```{}```
 */
function init() {
  // global tree
  if (!_.get(global, 'states.init.globalTree')) {
    const startTime = Game.cpu.getUsed();
    for (const roomName of _.keys(Memory.rooms)) {
      initRoom(Game.rooms[roomName]);
    }
    _.set(global, 'states.init.globalTree', Game.time);
    Logger.info(`global var initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
  }
  // creeps
  if (!_.get(global, 'states.init.creeps')) {
    const startTime = Game.cpu.getUsed();
    for (const creepName of _.keys(Game.creeps)) {
      initCreep(creepName);
    }
    _.set(global, 'states.init.creeps', Game.time);
    Logger.info(`global creep initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
  }
}

function initCreep(creepName) {
  _.set(global, ['creeps', creepName], {});
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
      type: LOOK_SOURCES,
      tasks: {}
    };
  }
  // structures
  for (const info of mem.structures) {
    globalMem.objs[info.id] = {
      x: info.x,
      y: info.y,
      type: info.structureType,
      isAtBase: isAtBase(new RoomPosition(info.x, info.y, room.name)),
      tasks: {}
    };
  }

  globalMem.queues = {
    sender: {},
    receiver: {},
    spawn: new TaskQueue(),
  };
}

/**
 * the task will be pushed into corresponding taskqueue in ```queue``` with ```srcType``` as the key
 * @param {Object.<string, TaskQueue>} queue a dictionary of task queues to push
 * @param {TakeTask|PayTask} task the task to push
 */
function enqueueSrctypedTask(queue, task) {
  const srcType = task.srcType;
  if (!queue[srcType]) {
    queue[srcType] = new TaskQueue();
  }

  queue[srcType].enqueue(task);
}

      isAtBase: isAtBase(new RoomPosition(info.x, info.y, room.name))

/**
 * Generate a list of tasks to receive demanding resources for the object
 * @param {string} roomName the name of room
 */
function generateReceiveTask(roomName) {
  const priority = {
    [STRUCTURE_LAB]: 3, // TODO
    [STRUCTURE_TERMINAL]: 4,
    [STRUCTURE_FACTORY]: 3, // TODO
    [STRUCTURE_SPAWN]: 1,
    [STRUCTURE_EXTENSION]: 1,
    [STRUCTURE_TOWER]: 2,
    [STRUCTURE_POWER_SPAWN]: 8, // TODO
    [STRUCTURE_NUKER]: 9, // TODO
  };

  /** @type {{objs: Object.<string, {x: number, y: number, type: string}>, queues: {receiver: Object.<string, TaskQueue>}}} */
  const mem = global.rooms[roomName];
  const objs = mem.objs;
  const queue = mem.queues.receiver;

  for (const id in objs) {
    if (Object.hasOwnProperty.call(objs, id)) {
      const elem = objs[id];
      const gameObjEntity = Game.getObjectById(id);
      if (!gameObjEntity) {
        Logger.warn(`Generating receiver task, probably lost vision of ${roomName} `, elem);
        // TODO request observer
        continue;
      }

      /** @type {StoreDefinition} */
      const store = gameObjEntity.store;

      switch (elem.type) {
        case STRUCTURE_SPAWN:
        case STRUCTURE_EXTENSION:
          if (store.getFreeCapacity(RESOURCE_ENERGY) > 0 && !elem.tasks[RESOURCE_ENERGY]) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              store.getFreeCapacity(RESOURCE_ENERGY),
              Game.getObjectById(id),
            );
            elem.tasks[RESOURCE_ENERGY] = task;
            enqueueSrctypedTask(queue, task);
          }
          break;
        case STRUCTURE_TOWER:
          if (!elem.isAtBase && store.getFreeCapacity(RESOURCE_ENERGY) > 100 && !elem.tasks[RESOURCE_ENERGY]) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              store.getFreeCapacity(RESOURCE_ENERGY),
              Game.getObjectById(id),
            );
            elem.tasks[RESOURCE_ENERGY] = task;
            enqueueSrctypedTask(queue, task);
          }
          break;
        case STRUCTURE_TERMINAL:
          if (!elem.isAtBase && store.getUsedCapacity(RESOURCE_ENERGY) < 20000 && !elem.tasks[RESOURCE_ENERGY]) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              20000 - store.getUsedCapacity(RESOURCE_ENERGY),
              Game.getObjectById(id),
            ); 
            elem.tasks[RESOURCE_ENERGY] = task;
            enqueueSrctypedTask(queue, task);
          }
          break;
        case STRUCTURE_LAB:
          if (store.getUsedCapacity(RESOURCE_ENERGY) < 1500 && !elem.tasks[RESOURCE_ENERGY]) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              store.getFreeCapacity(RESOURCE_ENERGY),
              Game.getObjectById(id),
            ); 
            elem.tasks[RESOURCE_ENERGY] = task;
            enqueueSrctypedTask(queue, task);
          }
          const memoryInfo = _.find(Memory.rooms[roomName].structures, (v) =>
            v.id == id
          )
          // reactor needs ingredient
          if (
            memoryInfo.type == 'reactant' &&
            store.getUsedCapacity(memoryInfo.srcType) < 1500 &&
            !elem.TakeTask[memoryInfo.srcType]
          ) {
            const task = new PayTask(
              priority[elem.type],
              memoryInfo.srcType,
              store.getFreeCapacity(memoryInfo.srcType),
              Game.getObjectById(id),
            );
            elem.tasks[memoryInfo.srcType] = task;
            enqueueSrctypedTask(queue, task); 
          }
          break;
        default:
          break;
      }
    }
  }
}

function generateTasks() {
  for (const roomName of _.keys(Memory.myRooms)) {
    this.generateReceiveTask(roomName);
  }
}

function marryTasks() {
  // /** @type {Object.<string, TaskQueue>} */
  // const senderQueue = queues.sender;

  /** @type {Creep} */
  for (const creep of _.values(Game.creeps)) {
    /* ignore creep that is 
      1. spawning
      2. with a task already
     */
    if (!global.creeps[creep.name]) {
      if (creep.spawning) {
        continue;
      }
      global.creeps[creep.name] = {};
    }
    if (global.creeps[creep.name].task) {
      continue;
    }


    const roomName = creep.memory.home;
    // TODO del
    if (!global.rooms[roomName]) {
      return;
    }
    /** @type {Object.<string, TaskQueue>} */
    const receiverQueues = global.rooms[roomName].queues.receiver;
    const srcType = _.keys(creep.store)[0];
    if (srcType && creep.memory.working) {
      /** @type {PayTask} */
      let task = null;
      // find a task
      
      if (receiverQueues[srcType]) {
        task = receiverQueues[srcType].peak();
      } 
      // store spares in storage
      if (!task && Game.rooms[roomName].storage) {
        task = new PayTask(10, srcType, creep.store.getUsedCapacity(srcType), Game.rooms[roomName].storage);
      }
      
      if (creep.memory.target == 'W32N11') {
        if (task && !task.prerequisite(creep) && creep.memory.role == HAULER) {
          Logger.warn(creep.name, task.prerequisite(creep), task);
        }
      }
      if (task && task.prerequisite(creep)) {
        // found valid marry for pay task
        global.creeps[creep.name].task = task;
        if (receiverQueues[srcType]) {
          receiverQueues[srcType].dequeue();
          if (creep.store.getUsedCapacity(srcType) < task.progressTotal) {
            const newTask = new PayTask(
              task.priority,
              srcType,
              task.progressTotal - creep.store.getUsedCapacity(srcType),
              Game.getObjectById(task.targetID),
              {
                action: this.action,
                prerequisite: this.prerequisite,
                callbacks: this.callbacks
              }
            );
            receiverQueues[srcType].enqueue(newTask);
            task.progressTotal = creep.store.getUsedCapacity(srcType)
          }
        }
        task.creepName = creep.name;
        task.status = 0;
        Logger.debug(`Marry: `, task)
      } else {
        global.creeps[creep.name].task = undefined;
      }
    }
  }
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
  generateReceiveTask,
  generateTasks,
  marryTasks
}