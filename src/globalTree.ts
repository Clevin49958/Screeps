import { Task, TaskQueue, TransferTask } from './task';
import { PayTask } from "./payTask";
import { Logger, wrapColor } from "./Logger";
import { labInfo, LabType } from './lab';
import { GlobalObjInfo, srcTypedCreepTaskDict, SrcTypedTaskQueue } from './globalClasses';
import { LAB_ENERGY_THRESHOLD, LAB_MINERAL_THRESHOLD, TERMINAL_ENERGY_THRESHOLD, TESTROOMS } from './config';


/**
 * Initialise global.rooms section base on ```initRoom```
 * 
 * Initialise global.creeps as ```{}```
 */
export function init() {
  if (!global.states) global.states = {} as any;
  if (!global.states.init) global.states.init = {} as any;

  // global tree
  if (!global.states.init.globalTree) {
    const startTime = Game.cpu.getUsed();
    global.rooms = {} as any;
    for (const roomName of _.keys(Memory.rooms)) {
      initRoom(Game.rooms[roomName]);
    }
    global.states.init.globalTree = Game.time;
    Logger.info(`global var initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
  }
  // creeps
  if (!global.states.init.creeps) {
    const startTime = Game.cpu.getUsed();
    global.creeps = {};
    for (const creepName of _.keys(Game.creeps)) {
      initCreep(creepName);
    }
    global.states.init.creeps = Game.time;
    Logger.info(`global creep initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
  }
}

function initCreep(creepName: string) {
  global.creeps[creepName] = {} as any;
}

/**
 *
 * @param {Room} room
 * @returns {number} ERR_* / OK
 */
export function initRoom(room: Room): ScreepsReturnCode {
  if (!room) {
    return ERR_NOT_FOUND;
  }

  global.rooms[room.name] = {} as any;
  const globalMem = global.rooms[room.name];
  const mem = room.memory;
  globalMem.objs = {};
  // sources
  for (const info of mem.sources) {
    globalMem.objs[info.id] = new GlobalObjInfo(info.id, info.x, info.y, LOOK_SOURCES, false);
  }
  // structures
  for (const info of mem.structures) {
    globalMem.objs[info.id] = new GlobalObjInfo(
      info.id,
      info.x,
      info.y,
      info.structureType,
      isAtBase(new RoomPosition(info.x, info.y, room.name))
    )
  }

  globalMem.queues = {
    sender: {},
    receiver: {},
    spawn: new TaskQueue<Task<any>>(),
  };
}

/**
 * get total scheduled amount of from a dictionary based by add the difference between progressTotal and progress
 * 
 * WARNING: both take task and pay task will be add together regardless of type
 */
function getTotalScheduledAmount(resourceTasks: srcTypedCreepTaskDict, srcType: ResourceConstant): number {
  if (!resourceTasks[srcType]) return 0;
  const list = _.values<TransferTask<any>>(resourceTasks[srcType]);
  if (list) {
    return _.sum(list.map(task => task.progressTotal - task.progress));
  } else {
    return 0
  }
}

/**
 * the task will be pushed into corresponding priority task queue in ```queue``` with ```srcType``` as the key
 * @param {SrcTypedTaskQueue} queue a dictionary of taskqueues with srcType as key to push
 * @param {TransferTask<any>} task the task to push
 */
export function enqueueSrctypedTaskWithPriority(queue: SrcTypedTaskQueue, task: TransferTask<any>) {
  const srcType = task.srcType;
  if (!queue[srcType]) {
    queue[srcType] = new TaskQueue();
  }

  queue[srcType].enqueue(task);
}

/**
 * Generate a list of tasks to send resources away from the object
 * @param {string} roomName the name of room
 */
// TODO
export function generateSendingTask(roomName) {
  const mem = global.rooms[roomName];
  const objs = mem.objs;

  for (const id in objs) {
    if (Object.hasOwnProperty.call(objs, id)) {
      
    }
  }
}

/**
 * Generate a list of tasks to receive demanding resources for the object
 * @param {string} roomName the name of room
 */
export function generateReceiveTask(roomName) {
  if (!Game.rooms[roomName]) return;
  
  // ignore: link, container, storage
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

  const mem = global.rooms[roomName];
  const objs = mem.objs;
  const queue = mem.queues.receiver;

  for (const id in objs) {
    if (Object.hasOwnProperty.call(objs, id)) {
      const elem = objs[id];
      const gameObjEntity = Game.getObjectById(id as Id<AnyStoreStructure>);
      if (!gameObjEntity) {
        Logger.warn(`Generating receiver task, probably lost vision of ${roomName} `, elem);
        // TODO request observer
        continue;
      }

      /** @type {StoreDefinition} */
      const store = gameObjEntity.store as StoreDefinition;
      /** the amount in demand after adjust of scheduled amount.
      It could be free space or used space depend on structure type */
      let adjustedAmount: number;
      switch (elem.type) {
        case STRUCTURE_SPAWN:
        case STRUCTURE_EXTENSION:
          adjustedAmount = store.getFreeCapacity(RESOURCE_ENERGY) -
            getTotalScheduledAmount(elem.resourceTasks, RESOURCE_ENERGY);
          if (adjustedAmount > 0) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              adjustedAmount, 
              elem,
              roomName,
              elem.isAtBase
            );
            task.bindTargetStructure();
            enqueueSrctypedTaskWithPriority(queue, task);
          }
          break;
        case STRUCTURE_TOWER:
          adjustedAmount = store.getFreeCapacity(RESOURCE_ENERGY) -
            getTotalScheduledAmount(elem.resourceTasks, RESOURCE_ENERGY);
          if (adjustedAmount > 100) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              adjustedAmount,
              elem,
              roomName,
              elem.isAtBase
            );
            task.bindTargetStructure();
            enqueueSrctypedTaskWithPriority(queue, task);
          }
          break;
        case STRUCTURE_TERMINAL:
          adjustedAmount = store.getUsedCapacity(RESOURCE_ENERGY) +
            getTotalScheduledAmount(elem.resourceTasks, RESOURCE_ENERGY);
          if (adjustedAmount < TERMINAL_ENERGY_THRESHOLD) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              TERMINAL_ENERGY_THRESHOLD - adjustedAmount,
              elem,
              roomName,
              elem.isAtBase
            ); 
            task.bindTargetStructure();
            enqueueSrctypedTaskWithPriority(queue, task);
          }
          break;
        case STRUCTURE_LAB:
          adjustedAmount = store.getUsedCapacity(RESOURCE_ENERGY) +
            getTotalScheduledAmount(elem.resourceTasks, RESOURCE_ENERGY);
          if (adjustedAmount < LAB_ENERGY_THRESHOLD) {
            const task = new PayTask(
              priority[elem.type],
              RESOURCE_ENERGY,
              LAB_ENERGY_CAPACITY - adjustedAmount,
              elem,
              roomName,
              elem.isAtBase
            ); 
            task.bindTargetStructure();
            enqueueSrctypedTaskWithPriority(queue, task);
          }
          const memoryInfo = _.find(Memory.rooms[roomName].structures, (v) =>
            v.id == id
          ) as labInfo;
          // reactor needs ingredient
          if (memoryInfo.state > 0 && memoryInfo.srcType) {
            adjustedAmount = store.getUsedCapacity(memoryInfo.srcType) +
              getTotalScheduledAmount(elem.resourceTasks, memoryInfo.srcType);
            if (
              memoryInfo.type == LabType.REACTANT &&
              adjustedAmount < LAB_MINERAL_THRESHOLD
            ) {
              const task = new PayTask(
                priority[elem.type],
                memoryInfo.srcType,
                LAB_MINERAL_CAPACITY - adjustedAmount,
                elem,
                roomName,
                elem.isAtBase
              );
              task.bindTargetStructure();
              enqueueSrctypedTaskWithPriority(queue, task);
            }
          }
          
          break;
        default:
          break;
      }
    }
  }
}

export function generateTasks() {
  for (const roomName of _.keys(Memory.myRooms)) {
    generateReceiveTask(roomName);
  }
}

export function marryTasks() {
  for (const creep of _.values<Creep>(Game.creeps)) {
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
    const receiverQueues = global.rooms[roomName].queues.receiver;
    const srcType = _.keys(creep.store)[0] as ResourceConstant;
    if (srcType && creep.memory.working) {
      // find a task
      let task = receiverQueues[srcType]?.peak() as PayTask<any>;

      // store spares in storage
      if (!task && global.rooms[roomName].storage) {
        const storageInfo = global.rooms[roomName].objs[global.rooms[roomName].storage.id]
        const freeCapacity = global.rooms[roomName].storage
          .store.getFreeCapacity(srcType) - getTotalScheduledAmount(storageInfo.resourceTasks, srcType)
        if (freeCapacity < 100) {
          Logger.info(`Dispose spare energy failed: full storage in ${roomName}`);
        } else {
          task = new PayTask(10, srcType, 
            _.min([
              creep.store.getUsedCapacity(srcType),
              freeCapacity
            ]), storageInfo, roomName, storageInfo.isAtBase);
            
          // TODO del
          (task as any).generatedBy = "redundent";

          if (task.prerequisite(creep)) {
            task.bindTargetStructure(creep.name).bindCreep(creep.name);
            task.status = 0;
            Logger.debug(`Dump extra resources`, global.creeps[creep.name])
          }
        }
      } else if (task && task.prerequisite(creep)) {
        // found valid marry for pay task

        /* 
        bond for a task: (bi === bidirectional)
         - task to creep (bi)
         - task to target (bi)
         - creep to target (as key in task array)
         - task to room queue
         */
        receiverQueues[srcType].dequeue();
        if (creep.store.getUsedCapacity(srcType) < task.progressTotal && TESTROOMS.includes(roomName) && true) {
          Logger.debug(`Dulp task detected: ${Logger.toMsg(task)}`);

          // get a fresh copy task and push it back to the queue
          const newTask = task.clone();

          // update progress for each task
          newTask.progressTotal = task.progressTotal - creep.store.getUsedCapacity(srcType);
          task.progressTotal = creep.store.getUsedCapacity(srcType);
          // TODO del
          (newTask as any).generatedBy = "duplicated";

          // old task needs to be married first because they share the same alternative id
          task.bindTargetStructure(creep.name).bindCreep(creep.name);
          newTask.bindTargetStructure();
          enqueueSrctypedTaskWithPriority(receiverQueues, newTask);

          Logger.trace(`old`, creep.name, task);
          Logger.trace(`new`, newTask.alternativeId, newTask);
          Logger.trace(`quque`, receiverQueues);
        } else {
          task.bindTargetStructure(creep.name).bindCreep(creep.name);
        }
        
        task.status = 0;
        Logger.trace(`Marry`, global.creeps[creep.name]);
      }
    }
  }
}
/**
 * check if the position is at base and handled by a keeper
 * by checking the presence of a flag named keeper-${roomName} nearby
 * @param {RoomPosition} pos the position to check
 * @returns {boolean}
 */
export const isAtBase = (pos: RoomPosition) => {
  return pos.findInRange(FIND_FLAGS, 1, {
    filter: (f) => f.name == `keeper-${pos.roomName}`,
  }).length > 0;
};