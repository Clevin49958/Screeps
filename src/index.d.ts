declare type BasicInfo<T> = import('./globalClasses').BasicInfo<T>;
declare type StructureInfo<T> = import('./globalClasses').StructureInfo<T>;
declare type excessProperty = import('./globalClasses').excessProperty;
declare type MineralInfo = import('./globalClasses').MineralInfo;
declare type GlobalObjInfo<T> = import('./globalClasses').GlobalObjInfo<T>;
declare type CreepTask = import('./task').CreepTask;
declare type SpawnTask = import('./spawnTask').SpawnTask;
declare type ControllerStatus = import('./memoryTree').ControllerStatus;
declare type SrcTypedTaskQueue = import('./globalClasses').SrcTypedTaskQueue;
declare type Task<T> = import('./task').Task<T>;
declare type TaskQueue<T> = import('./task').TaskQueue<T>;

// declare interface TravelToReturnData {
//   nextPos?: RoomPosition;
//   pathfinderReturn?: unknown; // originally PathfinderReturn
//   state?: unknown; // originally TravelState
//   path?: string;
// }

declare type CreepCount = {
  [roleName: string]: number;
}

declare var global: Global;
declare var Memory: Memory;

declare interface Creep {
  myMoveTo(destination: RoomPosition, option?: any): ScreepsReturnCode;
}

declare interface CreepMemory {
  working: boolean,
  role: string,
  bodyType: string,
  home: string,
  target: string
  [key: string]: unknown
}

declare interface FlagMemory { [name: string]: any }
declare interface SpawnMemory { [name: string]: any }
declare interface RoomMemory {
/** 
 * * true: my claimed room
 *
 * 0: neutral without controller
 *
 * 1: neutral with controller
 *
 * string: hostile owner/reserver's username
 *
 * array: my reserved room, array lists nearby claimed rooms
 */
  owner: ControllerStatus;
  sources: BasicInfo<Source>[];
  structures: StructureInfo<AnyStructure>[];
  walls: BasicInfo<StructureWall>[];
  roads: BasicInfo<StructureRoad>[];
  ramparts: BasicInfo<StructureRampart>[];
  mineral: MineralInfo;
  lastUpdate: number;

  // the followings are not init by `MemoryTree.initRoom`
  alternativeStorage?: Id<StructureContainer> | false;

  creepTrack:{
    home: CreepCount,
    visitor: CreepCount
  };

}

declare interface Memory extends excessProperty {
  rooms: {
    [roomName: string]: RoomMemory
  },
  myRooms: {
    [ownerRoom: string]: string[];
  },
  states: {
  init: {
      initMemoryTree?: boolean,
      preInitMemoryTree?: boolean,
    [name: string]: boolean
  },
    restart: {
      [roomName: string]: boolean
    },
    defending: {
      [roomName: string]: boolean
    }
  },
  config: {
    pause: boolean,
    [name: string]: boolean
  },
  stats: {
    /**
     * @deprecated
     */
    creepTrack: {
      [homeRoomName: string]: {
        [targetRoomName: string]: CreepCount
      }
    }
  }
}

interface Global extends excessProperty{
  states: {
    init: {
      globalTree: number,
      creeps: number,
      spawns: number,
      [name: string]: number
    },
  },  
  rooms: {
    [roomName: string]: {
      objs: {
        [id: string]: GlobalObjInfo<any>
      },
      queues: {
        sender: SrcTypedTaskQueue,
        receiver: SrcTypedTaskQueue,
        spawn: TaskQueue<Task<unknown>>
      },
      storage: StructureStorage|StructureContainer|null
    }
  },
  creeps: {
    [creepName: string]: {
      task?: CreepTask
    }
  }
}