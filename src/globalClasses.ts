import { LabType, LabState } from "./lab";
import { SpawnTask } from "./spawnTask";
import { TaskQueue, Task, TransferTask } from "./task";

export type SrcTypedTaskQueue = {
    [srcType in ResourceConstant]?: TaskQueue<TransferTask<any>>
}
export type srcTypedCreepTaskDict = {
  [srcType in ResourceConstant]?: {
    [creepName: string]: TransferTask<any>;
  }
}

export interface excessProperty {
  [key: string]: unknown
}

interface RoomObjectWithId extends RoomObject {
  id: Id<unknown>
}
export class BasicInfo<T extends RoomObjectWithId> implements excessProperty{
  id: Id<T>;
  x: number;
  y: number;
  [key: string]: unknown;

  static fromObj<T extends RoomObjectWithId>(obj: T): BasicInfo<T>{
    return new BasicInfo(obj.id as Id<T>, obj.pos.x, obj.pos.y);
  }

  constructor(id: Id<T>, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }
}

export class StructureInfo<T extends AnyStructure> extends BasicInfo<T> {
  structureType: StructureConstant;

  static fromStruc<T extends AnyStructure>(obj: T): StructureInfo<T> {
    const info = BasicInfo.fromObj(obj as RoomObjectWithId) as StructureInfo<T>;
    info.structureType = obj.structureType;
    return info;
  }

  constructor(id: Id<T>, x: number, y: number, structureType: StructureConstant) {
    super(id, x, y);
    this.structureType = structureType;
  }
}

export class GlobalObjInfo<T extends Source|AnyStructure> extends BasicInfo<T> {
  type: StructureConstant|LOOK_SOURCES;
  isAtBase: boolean;
  resourceTasks: srcTypedCreepTaskDict;
  constructor(id: Id<T>, x: number, y: number, structureType: StructureConstant|LOOK_SOURCES, isAtBase: boolean) {
    super(id, x, y);
    this.type = structureType;
    this.isAtBase = isAtBase;
    this.resourceTasks = {};
  }
}

export class MineralInfo extends BasicInfo<Mineral> {
  type: MineralConstant;

  static fromMineral(obj: Mineral): MineralInfo {
    const info: MineralInfo = BasicInfo.fromObj(obj as RoomObjectWithId) as MineralInfo;
    info.type = obj.mineralType;
    return info;
  }
  constructor(id: Id<Mineral>, x: number, y: number, type: MineralConstant) {
    super(id, x, y);
    this.type = type;
  }
}



export class LinkInfo extends StructureInfo<StructureLink> {
  type: string

  static getType(structure: StructureLink): string {
    if (structure.pos.findInRange(FIND_FLAGS, 1, {
      filter: (f) => f.name == `keeper-${structure.room.name}`,
    }).length > 0) {
      return 'receiver';
    } else {
      return 'sender';
    }
  }

  static fromLink(link: StructureLink): LinkInfo {
    const info: LinkInfo = StructureInfo.fromStruc(link) as LinkInfo;
    info.type = LinkInfo.getType(link);
    return info;
  }
  
  constructor(structure: StructureLink) {
    super(structure.id as Id<StructureLink>, structure.pos.x, structure.pos.y, STRUCTURE_LINK);
    this.type = LinkInfo.getType(structure);
  }
}

export class LabInfo extends StructureInfo<StructureLab> {
  srcType?: ResourceConstant;
  type: LabType;
  state: LabState;
  reactor?: unknown[];

  static setDefaultState(labInfo: LabInfo): void {
    labInfo.srcType = undefined;
    labInfo.state = LabState.OFF;
    labInfo.type = LabType.OFF;
    labInfo.reactor = [];
  }

  static fromLab(lab: StructureLab): LabInfo {
    const info: LabInfo = StructureInfo.fromStruc(lab) as LabInfo;
    LabInfo.setDefaultState(info);
    return info;
  }

  constructor(lab: StructureLab) {
    super(lab.id, lab.pos.x, lab.pos.y, STRUCTURE_LAB);
    LabInfo.setDefaultState(this);
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