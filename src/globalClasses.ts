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
  [key: string]: any
}

interface RoomObjectWithId extends RoomObject {
  id: Id<unknown>
}
export class BasicInfo<T extends RoomObjectWithId> implements excessProperty{
  id: Id<T>;
  x: number;
  y: number;

  static fromObj<T extends RoomObjectWithId>(obj: T): BasicInfo<RoomObjectWithId>{
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

  constructor(structure: AnyStructure) {
    super(structure.id as Id<T>, structure.pos.x, structure.pos.y);
    this.structureType = structure.structureType;
  }
}

export class GlobalObjInfo<T extends Source|AnyStoreStructure> extends BasicInfo<T> {
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

export class spawnInfo extends GlobalObjInfo<StructureSpawn> {
  // TODO
  // spawnTasks: 
}
