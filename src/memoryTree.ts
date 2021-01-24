import { Logger, wrapColor } from './Logger';
import { BasicInfo, StructureInfo, SpawnInfo, LinkInfo, MineralInfo } from './globalClasses';
import { isAtBase } from './globalClasses';
import { addOwnerRoom } from './init';
import { MEMORY_UPDATE_PERIOD } from './config';

/**
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
export type ControllerStatus = true | 0 | 1 | string | string[]; 

/**
 * Get the ownership status of controller
 * @param {StructureController?} controller
 * @returns {ControllerStatus} controller status 
 */
export function getControllerStatus(controller: StructureController): ControllerStatus {
  if (controller) {
    if (controller.my) {
      return true;
    } else if (controller.owner) {
      return controller.owner.username;
    } else {
      if (controller.reservation) {
        if (controller.reservation.username === Memory.userName) {
          // my reserved room
          const nearbyRooms = _.values<string>(Game.map.describeExits(controller.room.name));
          const res: string[] = [];
          nearbyRooms.forEach((roomName) => {
            if (Game.rooms[roomName]?.controller?.my) {
              res.push(roomName);
            }
          });
          return res;
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
  static updateOwnedStructures(room: Room, findConstant: FindConstant = FIND_MY_STRUCTURES): ScreepsReturnCode {
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
          mem.ramparts.push(BasicInfo.fromObj<StructureRampart>(structure));
          continue;

        case STRUCTURE_ROAD:
        case STRUCTURE_WALL:
          continue;

        case STRUCTURE_LINK:
          (info as LinkInfo).type = LinkInfo.getType(structure);
          break;

        case STRUCTURE_LAB:
          _.assign(info, {
            type: 'off',
            srcType: null,
            react: 0,
            rectors: null,
          });
          break;

        case STRUCTURE_SPAWN:

        case STRUCTURE_STORAGE:

        case STRUCTURE_TOWER:

        case STRUCTURE_POWER_SPAWN:

        default:
          break;
      }

      mem.structures.push(info);
    }
    return OK;
  }

  /**
   * Update section
   *  - walls
   *  - roads
   * in Memory.rooms
   * @param {Room} room
   */
  static updateInfrasctructures(room: Room): ScreepsReturnCode {
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
    mem.sources = room.find(FIND_SOURCES).map((s) => new BasicInfo(s.id, s.pos.x, s.pos.y)) || [];

    // mineral
    const mineral:Mineral = room.find(FIND_MINERALS)[0];
    mem.mineral = mineral ? MineralInfo.fromMineral(mineral) : null;

    // owner
    MemoryTree.updateOwner(room);

    // structures
    MemoryTree.updateOwnedStructures(room, FIND_STRUCTURES);
    MemoryTree.updateInfrasctructures(room);

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
    if (!_.get(room, 'memory.lastUpdate')) {
      return MemoryTree.initRoom(room);
    }
    let res: ScreepsReturnCode = OK;
    res = MemoryTree.updateOwner(room) || res;
    res = MemoryTree.updateOwnedStructures(room, FIND_STRUCTURES) || res;
    res = MemoryTree.updateInfrasctructures(room) || res;
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
      Logger.info(`Update room ${roomNames[index]}`);
      const res: ScreepsReturnCode = MemoryTree.updateRoom(Game.rooms[roomNames[index]]);
      if (res < OK) {
        Logger.warn(`Auto update room ${roomNames[index]} failed with ${res}`);
      }
    }
  }

  static preInit() {
    if (!Memory.states?.init?.preInitMemoryTree) {
      const startTime = Game.cpu.getUsed();
      Memory.sources = {};
      Memory.offence = {};
      Memory.creepDemand = {};
      Memory.stats = {
        creepTrack: {}
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
          addOwnerRoom(roomName);
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