import { Logger, wrapColor } from './Logger';
import { BasicInfo, StructureInfo, SpawnGlobalInfo, LinkInfo, MineralInfo, LabInfo, getNewCreepCountDict } from './globalClasses';
import { myRoom } from './util.myRooms';
import { MEMORY_UPDATE_PERIOD } from './config';

/**
 * 0: neutral without controller
 *
 * 1: neutral with controller
 * 
 * 2: my reserved room
 * 
 * 3: my claimed room
 *
 * string: hostile owner/reserver's username
 */
export type ControllerStatus = 0 | 1 | 2 | 3 | string; 

/**
 * Get the ownership status of controller
 * @param {StructureController?} controller
 * @returns {ControllerStatus} controller status 
 */
export function getControllerStatus(controller: StructureController): ControllerStatus {
  if (controller) {
    if (controller.my) {
      return 3;
    } else if (controller.owner) {
      return controller.owner.username;
    } else {
      if (controller.reservation) {
        if (controller.reservation.username === Memory.userName) {
          return 2;
        } else {
          return controller.reservation.username;
        }
      } else {
        return 1;
      }
    }
  } else {
    return 0;
  }
}

export class MemoryTree {
  private constructor() {}

    /**
   * update owner in Memory.rooms[room]
   * @param {Room} room
   * @returns {ScreepsReturnCode} ERR_* / OK
   */
  static updateOwner(room: Room): ScreepsReturnCode {
    const mem = Memory.rooms[room.name];
    if (!room) {
      return ERR_NOT_FOUND;
    } else {
      mem.owner = getControllerStatus(room.controller);
      if (mem.ownerRoomName && mem.owner != 2) {
        delete mem.ownerRoomName;
      }
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
   * @param {FindConstant} [findConstant=FIND_MY_STRUCTURES]
   * the find constant used for room.find,
   * replace by FIND_STRUCTURES to reuse results for finding walls/roads
   */
  static updateStructures(room: Room): ScreepsReturnCode {
    const mem = Memory.rooms[room.name].structure;

    // remove destroyed structures
    for (const structureType of _.keys(mem)) {
      for (const id of _.keys(mem[structureType])) {
        if (!Game.getObjectById(id as Id<any>)) {
          delete mem[structureType][id];
        }
      }
    }

    // add new structure
    for (const structure of room.find(FIND_STRUCTURES)) {
      const info = StructureInfo.fromStruc(structure);
      switch (structure.structureType) {
        case STRUCTURE_LINK:
          mem.link[structure.id] = LinkInfo.fromLink(structure);
          break;
        
        case STRUCTURE_LAB:
          mem.lab[structure.id] = LabInfo.fromLab(structure);
          break;

        case STRUCTURE_SPAWN:
        case STRUCTURE_EXTENSION:
        case STRUCTURE_STORAGE:
        case STRUCTURE_TOWER:
        case STRUCTURE_OBSERVER:
        case STRUCTURE_POWER_SPAWN:
        case STRUCTURE_EXTRACTOR:
        case STRUCTURE_TERMINAL:
        case STRUCTURE_CONTAINER:
        case STRUCTURE_NUKER:
        case STRUCTURE_FACTORY:
        case STRUCTURE_ROAD:
        case STRUCTURE_WALL:
        case STRUCTURE_RAMPART:
          if (!mem[structure.structureType][structure.id]) {
            mem[structure.structureType][structure.id] = StructureInfo.fromStruc(structure) as StructureInfo<any>;
          }
          break;

        default:
          break;
      }
    }
    return OK;
  }

  /**
   * Init the following sections in `RoomMemory`:
   *  - owner
   *  - sources
   *  - structures
   *  - walls
   *  - roads
   *  - ramparts
   *  - mineral
   * @param {Room} room
   * @returns {number} ERR_* / OK
   */
  static initRoom(room: Room) {
    if (!room) {
      return ERR_NOT_FOUND;
    }

    _.set(Memory, `rooms.${room.name}`, {});
    const mem = room.memory;

    // sources
    mem.source = room.find(FIND_SOURCES).map((s) => new BasicInfo(s.id, s.pos.x, s.pos.y)) || [];

    // mineral
    const mineral:Mineral = room.find(FIND_MINERALS)[0];
    mem.mineral = mineral ? MineralInfo.fromMineral(mineral) : null;

    mem.structure = {
      spawn: {},
      extension: {},
      link: {},
      storage: {},
      tower: {},
      observer: {},
      powerSpawn: {},
      extractor: {},
      lab: {},
      terminal: {},
      container: {},
      nuker: {},
      factory: {},
      road: {},
      constructedWall: {},
      rampart: {},
    }
    // owner
    MemoryTree.updateOwner(room);

    // structures
    MemoryTree.updateStructures(room);
    
    // creep count
    if (mem.owner >= 2){
      mem.creepTrack = getNewCreepCountDict();

      if (!mem.creepDemand) {
        mem.creepDemand = getNewCreepCountDict();
      }
    }

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
   * @returns {ScreepsReturnCode} result
   */
  static updateRoom(room: Room): ScreepsReturnCode {
    if (!room?.memory.lastUpdate) {
      return MemoryTree.initRoom(room);
    }
    let res: ScreepsReturnCode = OK;
    res = MemoryTree.updateOwner(room) || res;
    res = MemoryTree.updateStructures(room) || res;
    // set update timer
    room.memory.lastUpdate = Game.time;
    return res;
  }

  /**
   * cycle through all visible rooms and update next room every PERIOD ticks
   */
  static autoUpdateRoom() {
    const PERIOD = MEMORY_UPDATE_PERIOD;
    // prevent too much expensive execution on the same tick remainder
    const REMAINDER = 1;
    if (Game.time % PERIOD == REMAINDER) {
      const roomNames = _.keys(Game.rooms);
      const index = (Game.time - REMAINDER) % (PERIOD * roomNames.length) / PERIOD;
      Logger.info(wrapColor('yellow', `Update room ${roomNames[index]}`));
      const res: ScreepsReturnCode = MemoryTree.updateRoom(Game.rooms[roomNames[index]]);
      if (res < OK) {
        Logger.warn(`Auto update room ${roomNames[index]} failed with ${res}`);
      }
    }
  }

  static preInit() {
    if (!Memory.states?.init?.preInitMemoryTree) {
      const startTime = Game.cpu.getUsed();
      // back support purposes
      Memory.sources = Memory.sources || {};
      Memory.stats = {
        creepTrack: {},
        creepAcc: getNewCreepCountDict(),
      };
      Memory.states = {
        restart: {},
        defending: {},
        init: {}
      };
      Memory.myRooms = {};
      for (const roomName in Game.rooms) {
        if (Object.hasOwnProperty.call(Game.rooms, roomName)) {
          const room = Game.rooms[roomName];
          Memory.sources[roomName] = room.find(FIND_SOURCES).length;
          myRoom.addClaimedRoom(roomName);
        }
      }
      _.set(Memory, 'states.init.preInitMemoryTree', true);
    }
  }

  /**
   * Initialise Memory.rooms section base on ```initRoom```
   */
  static init() {
    if (!Memory.states?.init?.initMemoryTree) {
      const startTime = Game.cpu.getUsed();
      for (const roomName of _.keys(Game.rooms)) {
        MemoryTree.initRoom(Game.rooms[roomName]);
      }
      _.set(Memory, 'states.init.initMemoryTree', true);
      Logger.info(`Memory initiation completed using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
    } else {
      let startTime = Game.cpu.getUsed();
      for (const roomName of _.keys(Game.rooms)) {
        if (!Memory.rooms[roomName]) {
          MemoryTree.initRoom(Game.rooms[roomName]);
          Logger.info(`Memory superaddition of ${roomName} using ${(Game.cpu.getUsed() - startTime).toFixed(3)} ms`);
          startTime = Game.cpu.getUsed();
        }
      }
      _.set(Memory, 'states.init.initMemoryTree', true);
    }
  }
}