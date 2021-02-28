import { callbackFunc, Task } from "./task";
import { Logger } from "./Logger";
import { ATK_RANGE, ATTACKER, BALANCED, CLAIMER, HARVESTER, HAULER, HEALER, HEAVY_WORKER, KEEPER, MINER, REPAIRER, ROLE_NAMES, SCOUT, SpawnGlobalInfo, WALL_REPAIRER, zeroCreepCountDict } from "./globalClasses";
import { BUILDER, HARV_REMOTE, UPGRADER } from "./helper";
export class SpawnTask extends Task<StructureSpawn> {
  spawn: SpawnGlobalInfo;
  target: string;
  home: string;
  // bodyType: string;
  private _body: BodyPartConstant[];
  
  public get body() : BodyPartConstant[] {
    if (!this._body) {
      this._body = SpawnTaskBuilder.getBody(SpawnTaskBuilder.getBodyTypeFromRole(this.role, this.home), this.energy);
    }
    return this._body;
  }
  
  private _energy: number;

  
  public get energy() : number {
    if (!this._energy) {
      this._energy = Game.rooms[this.home]?.energyCapacityAvailable;
    }
    return this._energy;
  }
  
  role: string;
  creepName: string;
  additionalMemory: excessProperty;
  spawnOpts: SpawnOptions;



  get alternativeId(): string {
    return `spawn-${this.home}-${this.target}-${this.creepName}`;
  }

  perform(performer: StructureSpawn): ScreepsReturnCode {
    if (performer.id != this.spawn.id) {
      Logger.warn(`Performing spawn task: got ${performer.id}; expect: ${this.spawn.id}`);
      return ERR_INVALID_TARGET;
    }
    
    if (performer) {
      if (performer.spawning) {

      } else {
        const creepMemory: CreepMemory = _.assign({
            working: false,
            role: this.role,
            // bodyType: this.bodyType,
            target: this.target,
            home: this.home,
          },
          this.additionalMemory
        );

        const spawnOpts: SpawnOptions = _.assign({
            memory: creepMemory
          },
          this.spawnOpts
        )
        return Game.spawns[this.spawn.name].spawnCreep(
          this.body,
          this.creepName,
          spawnOpts
        );
      }
    } else {
      Logger.warn(`Can't find spawn ${this.spawn.name}`);
      throw new Error("Lost spawn while performing spawning task");
    }
  }

  prerequisite(spawn: StructureSpawn): boolean {
    return true;
  }
  onComplete(status: number): void {
    Logger.trace(`Task by spawn ${this.spawn.name} complete ${status}`);
    this.callbacks.forEach(f => f(this, status));
    this.unbindSpawn(this.spawn);
  }

  constructor(
    priority: number,
    homeRoomName: string,
    targetRoomName: string,
    // bodyType: string,
    role: string,
    creepName: string,
    additionalMemory: excessProperty = {},
    energy?: number,
    body?: BodyPartConstant[],
    spawnOpts: SpawnOptions = {},
    callbacks: callbackFunc<StructureSpawn>[] = []
  ) {
    super(priority, callbacks);
    this.home = homeRoomName;
    this.target = targetRoomName;
    // this.bodyType = bodyType;
    // this.body = body;
    this.role = role;
    this.creepName = creepName;
    this.additionalMemory = additionalMemory;
    this.spawnOpts = spawnOpts;

    if (body) {
      this._body = body;
    } else {
      this._energy = energy;
    }
  }

  bindSpawn(spawn: SpawnGlobalInfo): this {
    const spawnName = spawn.name;
    if (!global.spawns[spawnName]) {
      // TODO del
      Logger.warn(spawnName, this);
      throw new Error("Spawn memory not found");
    }
    if (global.spawns[spawnName].task) {
      throw new Error(`Task existed for ${spawnName}: ${Logger.toMsg(global.spawns[spawnName].task)}`)
    }
    global.spawns[spawnName].task = this;
    this.spawn = spawn;
    Logger.trace(`bind: ${this.alternativeId} from ${spawnName}`)
    return this;
  }

  unbindSpawn(spawn: SpawnGlobalInfo): this {
    const spawnName = spawn.name;
    if (!global.spawns[spawnName]?.task) {
      throw new Error(`No task was found on spawn ${spawnName}`);
    } else if (global.spawns[spawnName]?.task?.alternativeId == this.alternativeId) {
      Logger.trace(`unbind: ${this.alternativeId} from ${spawnName}`);
     global.spawns[spawnName].task = null;
    } else {
      Logger.warn(spawnName, global.spawns[spawnName].task.alternativeId, global.spawns[spawnName], this.spawn.name, this.alternativeId, global.spawns[this.spawn.name])
      throw new Error(`Spawn wasn't binded to this task. spawn ${global.spawns[spawnName]?.task?.alternativeId}; this: ${this.alternativeId}`);
    }
    
    return this;
  }

  
  
}

export class SpawnTaskBuilder {
  static allocateCreepName(role: string, home: string): string {
    const id = Memory.stats.creepAcc[role];

    // update count
    Memory.stats.creepAcc[role] += 1;
    if (Memory.stats.creepAcc[role] == 10000) {
      Memory.stats.creepAcc[role] = 0;
    }

    return `${role.substr(0, 5)}-${id}-${home}`;
  }

  static collectCreepCount(): void {
    // clear existing count
    for (const roomName of _.keys(Memory.rooms)) {
      const mem = Memory.rooms[roomName];
      if (mem.owner >= 2) {
        zeroCreepCountDict(mem.creepTrack);
      }
    }

    for (const creepName of _.keys(Game.creeps)) {
      const mem = Game.creeps[creepName].memory;
      Memory.rooms[mem.target].creepTrack[mem.role] += 1;
    }
  }

  static updateLiveCreepDemand(roomName: string) {
    const globalMem = global.rooms[roomName];
    const demand = Memory.rooms[roomName]?.creepDemand;
    // TODO update all roles with their own logic

    if (!globalMem || !demand) {
      throw new Error("Room not found");
    }
    for (const roleName of ROLE_NAMES) {
      globalMem.creepLiveDemand[roleName] = globalMem.creepDemandAdjustment[roleName] + demand[roleName];
    }
  }

  static getFreeSpawns(roomName: string): StructureSpawn[] {
    const spawnIds = _.keys(Memory.rooms[roomName].structure.spawn) as Id<StructureSpawn>[] || [];
    const spawns = _.map<Id<StructureSpawn>, StructureSpawn>(spawnIds, Game.getObjectById);
    return _.filter(spawns, s => s && !s.spawning);
  }
  /**
   * Get number of body parts for the construction of body.
   * 
   * E.g. for body parts costs [50, 100, 50] and energy of 300,
   * the return will be [2, 1, 1]. (50 + 100 + 50) + 50 and a residual of 50 unused (unless only residual is MOVE)
   * if residual is set to false, the return will be [1,1,1]
   * 
   * @param bodyParts type of body parts used
   * @param energy energy available for body parts
   * @returns number of each body parts used
   */

  public static countGetter(bodyParts: BodyPartConstant[], energy: number, residual: boolean = true): number[] {
    const sum = _.sum(bodyParts.map(v => BODYPART_COST[v]));
    const quotient = Math.floor(energy / sum);
    const res: number[] = Array(bodyParts.length).fill(quotient);

    if (residual) {
      let remainder = energy % sum;
      for (let i = 0; i < bodyParts.length && remainder > 0; i++) {
        remainder -= BODYPART_COST[bodyParts[i]];
        res[i] += 1;
      }
    }
    return res;
  }

  /**
    * Body will be generated in the format of [a,a,a,b,b,b,c,c,c,...] by default.
    * When stack is set to false, the result will be [a,b,c,a,b,c,a,b,c,...]
    * @param bodyParts type of body parts to loop through
    * @param counts counts returned by countGetter
    * @param stack order of returned body array
    */
  public static generateBody(bodyParts: BodyPartConstant[], counts: number[], stack: boolean = true): BodyPartConstant[] {
    const res: BodyPartConstant[] = [];
    if (stack) {
      for (let j = 0; j < counts.length; j++) {
        const count = counts[j];
        const part = bodyParts[j];
        for (let i = 0; i < count; i++) {
          res.push(part);
        }
      }
    } else {
      // push bodyparts in excess first
      const minNum = _.min(counts);
      for (let i = 0; i < counts.length; i++) {
        const count = counts[i];
        for (let j = count; j > minNum; j--) {
          res.push(bodyParts[i]);
        }
      }
      // then push the rest in multiples of repeating unit
      for (let i = 0; i < minNum; i++) {
        for (const part of bodyParts) {
          res.push(part);
        }
      }
    }

    return res;
  }

  static getBody(bodyType: string, energy: number): BodyPartConstant[] {
    switch (bodyType) {
      case BALANCED:
        const unit = [MOVE, WORK, CARRY];
        return this.generateBody(unit, this.countGetter(unit, energy));
        break;
    
      default:
        throw new Error("Not implemented");
        break;
    }
  }

  static getBodyTypeFromRole(role: string, roomName: string): string {
    let type: string;
    switch (role) {
      case HARVESTER, BUILDER, REPAIRER, WALL_REPAIRER:
        type = BALANCED;
        break;
      
      case UPGRADER:
        type = Game.rooms[roomName].controller?.level > 3 ? HEAVY_WORKER : BALANCED;
        break;

      default: 
        // HARV_REMOTE, CLAIMER, ATK_RANGE, ATTACKER, HEAL_POWER, MINER, KEEPER
        type = role;
        break;
    }

    return type;
  }

  static getPriorityFromRole(role: string, roomName: string): number {
    const dict = {
      [HARV_REMOTE]: 1,
      [HARVESTER]: 2,
      [HAULER]: 2,

      [ATK_RANGE]: 6,
      [HEALER]: 7,
      [ATTACKER]: 8,
      [KEEPER]: 9,
      
      [CLAIMER]: 10,

      [REPAIRER]: 11,
      [BUILDER]: 12,
      [WALL_REPAIRER]: 13,

      [UPGRADER]: 30,

      [SCOUT]: 99,
      [MINER]: 100,
    }

    return dict[role];
  }

  static generateSpawnTasks(roomName: string) {
    if (Memory.rooms[roomName]?.owner < 2) {
      throw new Error("Room not owned");
    }

    const demand = global.rooms[roomName].creepLiveDemand;
    const track = Memory.rooms[roomName].creepTrack;

    for (const role of ROLE_NAMES) {
      let delta = demand[role] - track[role];
      delta = delta > 0 ? delta : 0;

      for (let i = 0; i < delta; i++) {

        const task = new SpawnTask(
          this.getPriorityFromRole(role, roomName),
          Memory.rooms[roomName].ownerRoomName,
          roomName,
          // this.getBodyTypeFromRole(role),
          role,
          this.allocateCreepName(role, Memory.rooms[roomName].ownerRoomName),
        );

        global.rooms[roomName].queues.spawn.enqueue(task);
      }
    }
  }

}
