/**
 * This module aim to provide a list of base classes for task based process
 */
import { srcTypedCreepTaskDict } from './globalClasses';
import { Logger } from './Logger';
import {PriorityQueue, QueueNode} from './priorityQueue';


export class TaskQueue<T extends Task<any>> extends PriorityQueue<T> {
  constructor() {
    super();
  }
}

// task interfaces
export interface actionFunc<Performer> {
  (obj: Performer, opts?: any): number;
}

export interface prerequisiteFunc<Performer> {
  (obj: Performer): boolean;
}

export interface callbackFunc<Performer> {
  (task: Task<Performer>, status: number): void;
}

export interface taskOptions<Performer> {
  action?: actionFunc<Performer>,
  prerequisite?: prerequisiteFunc<Performer>,
  callbacks?: callbackFunc<Performer>[]
}

export abstract class Task<Performer> implements QueueNode{
  /**
    * 1: complete
    *
    * 0~1: in progress (decimal may indicate progress)
    *
    * 0: intiated
    *
    * -1: failed
    * 
    * -2: waiting for marriage
    */
  priority: number;
  status: number;
  readonly generatedTime: number;
  abstract get alternativeId(): string;

  perform: actionFunc<Performer>;
  prerequisite: prerequisiteFunc<Performer>;
  callbacks: callbackFunc<Performer>[];
  abstract onComplete(status: number): void;

  constructor(
    priority: number,
    action: actionFunc<Performer>,
    prerequisite: prerequisiteFunc<Performer>,
    callbacks: callbackFunc<Performer>[]
  ) {
    this.priority = priority;
    
    this.status = -2;
    this.generatedTime = Game.time;
    this.perform = action;
    this.prerequisite = prerequisite;
    this.callbacks = callbacks;
  }
}

export abstract class CreepTask extends Task<Creep> {
  private _creepName: string;
  roomName: string;
  
  public get creepName() : string {
    return this._creepName;
  }

  public set creepName(value: string) {
    if (this._creepName) {
      throw new Error(`Reset creepName; current: ${this._creepName}, attempt: ${value}`);
    } else {
      this._creepName = value;
    }
  }

  bindCreep(creepName: string): this {
    this.creepName = creepName;

    if (!global.creeps[creepName]) {
      // TODO del
      Logger.warn(creepName, this);
      throw new Error("Creep memory not found");
    }

    if (global.creeps[creepName].task) {
      throw new Error(`Task existed for ${creepName}: ${Logger.toMsg(global.creeps[creepName].task)}`)
    }
    global.creeps[creepName].task = this;

    return this;
  }

  unbindCreep(creepName: string): this {
    if (global.creeps[creepName]?.task?.alternativeId == this.alternativeId) {
     global.creeps[creepName].task = null;
    } else {
      Logger.warn(global.creeps[creepName]?.task, (this as unknown as TransferTask<any>).target);
      throw new Error(`Creep wasn't binded to this task. Creep ${global.creeps[creepName]?.task?.alternativeId}; this: ${this.alternativeId}`);
    }
    
    return this;
  }

  constructor(
    priority: number,
    roomName: string,
    action: actionFunc<Creep>,
    prerequisite: prerequisiteFunc<Creep>,
    callbacks: callbackFunc<Creep>[]
  ) {
    super(priority, action, prerequisite, callbacks);
    this.roomName = roomName;
  }
}

export abstract class TransferTask<Target extends AnyStoreStructure> extends CreepTask {
  srcType: ResourceConstant;
  progress: number;
  progressTotal: number;
  target: GlobalObjInfo<Target>;
  handledByKeeper: boolean;

  /**
   * bind the task under target structure with creep name as the key and remove premature binding
   * 
   * when the task is not married to a creep yet, an alternative id is used. see implementation of `alternativeId`
   * @param bindingKey the creep Name to bind
   */
  bindTargetStructure(bindingKey?: string): this {
    const srcTypedCreepTaskDict: srcTypedCreepTaskDict = this.target.resourceTasks;
    const srcType: ResourceConstant = this.srcType;
      
    if (!srcTypedCreepTaskDict[srcType]) {
      srcTypedCreepTaskDict[srcType] = {};
    }

    // bind to target structure
    if (bindingKey) {
      // remove premature binding and rebind
      this.unbindTargetStructure();
      srcTypedCreepTaskDict[srcType][bindingKey] = this;
    } else {
      // initial bind, rebind expected
      srcTypedCreepTaskDict[srcType][this.alternativeId] = this;
    }

    return this;
  }

  unbindTargetStructure(): this {
    if (this.creepName) {
      delete this.target.resourceTasks[this.srcType][this.creepName];
    } else {
      delete this.target.resourceTasks[this.srcType][this.alternativeId];
    }
    return this;
  }

  constructor(
    priority: number,
    srcType: ResourceConstant,
    amount: number,
    target: GlobalObjInfo<Target>,
    handledByKeeper: boolean,
    roomName: string,
    action: actionFunc<Creep>,
    prerequisite: prerequisiteFunc<Creep>,
    callbacks: callbackFunc<Creep>[]
  ) {
    super(priority, roomName, action, prerequisite, callbacks);
    this.srcType = srcType;
    this.progressTotal = amount;
    this.progress = 0;
    this.target = target;
    this.handledByKeeper = handledByKeeper;
  }
}

