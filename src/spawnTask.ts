
export class SpawnTask extends Task<StructureSpawn> {
  spawn: SpawnGlobalInfo;
  target: string;
  home: string;
  bodyType: string;
  body: BodyPartConstant[];
  role: string;
  energy: number;
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
            bodyType: this.bodyType,
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
    bodyType: string,
    body: BodyPartConstant[],
    role: string,
    energy: number,
    creepName: string,
    additionalMemory: excessProperty = {},
    spawnOpts: SpawnOptions = {},
    callbacks: callbackFunc<StructureSpawn>[] = []
  ) {
    super(priority, callbacks);
    this.home = homeRoomName;
    this.target = targetRoomName;
    this.bodyType = bodyType;
    this.body = body;
    this.role = role;
    this.energy = energy;
    this.creepName = creepName;
    this.additionalMemory = additionalMemory;
    this.spawnOpts = spawnOpts;
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
