declare type MyRooms = import('./util.myRooms').MyRooms;
declare type BasicInfo<T> = import('./globalClasses').BasicInfo<T>;
declare type StructureInfo<T> = import('./globalClasses').StructureInfo<T>;
declare type excessProperty = import('./globalClasses').excessProperty;
declare type MineralInfo = import('./globalClasses').MineralInfo;
declare type SpawnInfo = import('./globalClasses').SpawnGlobalInfo;
declare type LabInfo = import('./globalClasses').LabInfo;
declare type LinkInfo = import('./globalClasses').LinkInfo;
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
};

declare var global: NodeJS.Global & typeof globalThis & Global;
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
  ownerRoomName?: string;
  source: BasicInfo<Source>[];
  structure: {
    link: {[id: string]: LinkInfo};
    lab: {[id: string]: LabInfo};
    spawn: {[id: string]: StructureInfo<StructureSpawn>};
    extension: {[id: string]: StructureInfo<StructureExtension>};
    storage: {[id: string]: StructureInfo<StructureStorage>};
    tower: {[id: string]: StructureInfo<StructureTower>};
    observer: {[id: string]: StructureInfo<StructureObserver>};
    powerSpawn: {[id: string]: StructureInfo<StructurePowerSpawn>};
    extractor: {[id: string]: StructureInfo<StructureExtractor>};
    terminal: {[id: string]: StructureInfo<StructureTerminal>};
    container: {[id: string]: StructureInfo<StructureContainer>};
    nuker: {[id: string]: StructureInfo<StructureNuker>};
    factory: {[id: string]: StructureInfo<StructureFactory>};

    road: {[id: string]: StructureInfo<StructureRoad>};
    constructedWall: {[id: string]: StructureInfo<StructureWall>};
    rampart: {[id: string]: StructureInfo<StructureRampart>};
    
    [structureTypePlaceholder: string]: {[id: string]: StructureInfo<any>};
  }

  /**
   * @deprecated
   */
  structures: StructureInfo<AnyStructure>[];
  /**
   * @deprecated
   */
  walls: BasicInfo<StructureWall>[];
  /**
   * @deprecated
   */
  roads: BasicInfo<StructureRoad>[];
  /**
   * @deprecated
   */
  ramparts: BasicInfo<StructureRampart>[];


  mineral: MineralInfo;

  creepTrack?: CreepCount;

  /**
   * static creep demand, altered when there is a room status change/global goal change
   * 
   * refer to global.room[roomName].creepDemand for live demand.
   */
  creepDemand?: CreepCount;

  lastUpdate: number;

  // the followings are not init by `MemoryTree.initRoom`
  alternativeStorage?: Id<StructureContainer> | false;



}

declare interface Memory {
  userName: string,
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
    [name: string]: any,
  },
  stats: {
    /**
     * @deprecated
     */
    creepTrack: {
      [homeRoomName: string]: {
        [targetRoomName: string]: CreepCount,
      }
    },
    /** 
     * creep id accumulator
     * such that each creep is given a unique id number
     */
    creepAcc: CreepCount,
  }
  /**
   * @deprecated
   */
  sources: {
    [roomName: string]: number
  },
}

interface Global extends excessProperty, NodeJS.Global{
  config: {
    [item: string]: any,
  },

  scout: {
    [homeRoom: string]: string[],
  },

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
        spawn: TaskQueue<Task<unknown>>,
      },
      // TODO have a single counter for each role rather than per role per room
      creepDemand: CreepCount,
      creepDemandAdjustment: CreepCount,
      creepLiveDemand: CreepCount,
      storage: StructureStorage|StructureContainer|null,
    }
  },
  myRooms: MyRooms,
  creeps: {
    [creepName: string]: {
      task?: CreepTask
    }
  },
  spawns: {
    [spawnName: string]: {
      task?: SpawnTask
    }
  }
}