import { CLAIMER, getNewCreepCountDict, HARV_REMOTE, HAULER, UPGRADER } from "./globalClasses";
import { GlobalTree } from "./globalTree";
import { Logger } from "./Logger";


export class MyRooms {
  static _instance: MyRooms;

  private constructor() {}

  static getInstance(): MyRooms {
    if (!this._instance) {
      this._instance = new MyRooms();
    }
    return this._instance;
  }

  private getNumOfSources(roomName: string): number | undefined {
    return Memory.rooms[roomName]?.source?.length;
  }

  /**
   * This function will check if the room has a record in Memory.rooms
   * and display warning if not
   * @param roomName the room to check
   */
  private roomExistanceCheck(roomName: string): boolean {
    const res = Boolean(Memory.rooms[roomName]?.lastUpdate);
    if (!res) {
      Logger.warn(`${roomName} not found in Memory`);
    }
    return res;
  }

  getDefaultCreepConfig(owner: boolean = false, sources: number): CreepCount {
    const creepCount = getNewCreepCountDict();
    creepCount[HARV_REMOTE] = sources;
    creepCount[HAULER] = sources;
    creepCount[UPGRADER] = owner ? 1 : 0;
    creepCount[CLAIMER] = owner ? 0 : 1;
    return creepCount;
  }

  addReservedRoom(reservedRoom: string, claimedRoom: string, sources?: number, demands: CreepCount = {}): ScreepsReturnCode {
    if (!this.roomExistanceCheck(reservedRoom)) {
      return ERR_INVALID_TARGET;
    }

    sources = this.getNumOfSources(reservedRoom) || sources;
    if (sources === undefined) {
      return ERR_INVALID_ARGS;
    }

    demands = _.merge(this.getDefaultCreepConfig(false, sources), demands);

    if (!Memory.myRooms[claimedRoom].includes(reservedRoom)) {
      Memory.myRooms[claimedRoom].push(reservedRoom);
    }

    const mem = Memory.rooms[reservedRoom];
    mem.owner = 2;
    mem.ownerRoomName = claimedRoom;

    // TODO: load room into global
    GlobalTree.initRoom(Game.rooms[reservedRoom]);
    return OK;
  }

  addClaimedRoom(claimedRoom: string, sources?: number, demands: CreepCount = {}): ScreepsReturnCode{
    if (!this.roomExistanceCheck(claimedRoom)) {
      return ERR_INVALID_ARGS;
    }
    sources = this.getNumOfSources(claimedRoom) || sources;
    if (sources === undefined) {
      return ERR_INVALID_ARGS;
    }

    demands = _.merge(this.getDefaultCreepConfig(false, sources), demands);

    if (!Memory.myRooms[claimedRoom]) {
      Memory.myRooms[claimedRoom] = [claimedRoom];
    }

    if (Memory.rooms[claimedRoom]) {
      const mem = Memory.rooms[claimedRoom];
      mem.owner = 3;
      mem.ownerRoomName = claimedRoom;
    } else {
      Logger.warn(`Room ${claimedRoom} doesn't exist in memory`);
      return ERR_INVALID_TARGET;
    }

    // TODO: load room into global
    return OK;
  }

  removeReservedRoom(reservedRoom: string, claimedRoom: string): CreepCount {
    const index = Memory.myRooms[claimedRoom]?.findIndex(r => r == reservedRoom);
    if (index === -1 || index === undefined) {
      throw new Error(`Reserved Room ${reservedRoom} not found under ${claimedRoom}`);
    }

    if (!Memory.rooms[reservedRoom]) {
      throw new Error(`Room ${reservedRoom} not found in memory`);
    }

    const mem = Memory.rooms[reservedRoom];
    mem.owner = 2;
    delete mem.ownerRoomName;

    const demand = mem.creepDemand;
    delete mem.creepDemand;
    return demand;
  }

  transferReservedRoom(reservedRoom: string, oldOwner: string, newOwner: string): ScreepsReturnCode {
    return this.addReservedRoom(reservedRoom, newOwner, undefined, this.removeReservedRoom(reservedRoom, oldOwner));
  }

}

global.myRooms = MyRooms.getInstance();

export const myRoom = MyRooms.getInstance();