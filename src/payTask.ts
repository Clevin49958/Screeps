import { HARVESTER, HAULER, KEEPER, MINER } from "./helper";
import { Logger } from "./Logger";
import { CreepTask, taskOptions, TransferTask } from "./task";

export class PayTask<Target extends AnyStoreStructure> extends TransferTask<Target> {
  get alternativeId(): string {
    return `pay-${this.roomName}-${this.target.type}-${this.generatedTime}-${this.target.id}`;
  }

  private defaultPrerequisite(creep: Creep): boolean {
    return (
      creep.store.getUsedCapacity(this.srcType) > 0 &&
      creep.memory.target == this.roomName &&
      creep.memory.home == this.roomName &&
      /* keeper at base or others to a structure not at base */
      (
        (
          creep.memory.role == KEEPER &&
          this.handledByKeeper
        ) ||
        (
          [HAULER, HARVESTER].includes(creep.memory.role) &&
          creep.memory.working &&
          !this.handledByKeeper
        ) ||
        (
          creep.memory.role != MINER &&
          this.srcType != RESOURCE_ENERGY &&
          !this.handledByKeeper
        )
      )
    );
  };

  /**
    * creep will pay $amount of $srcType to $target
    * @param {Creep} creep the creep to perform task
    * @returns {number} result of task:
    * 1: complete
    * 0: OK
    * <0: one of the ERR_*
    */
  private defaultAction(creep: Creep): ScreepsReturnCode | 1 {
    if (this.status < 0) {
      throw new Error(`Task performed with status ${this.status}`);
      
    }
    creep.say(`${this.priority}:${this.progress}`);
    // pay structure
    const structure = Game.getObjectById(this.target.id as Id<Target>);
    const pos = new RoomPosition(this.target.x, this.target.y, this.roomName);
    if (creep.pos.isNearTo(pos)) {
      // pay
      const amountToPay = _.min([
        creep.store.getUsedCapacity(this.srcType),
        this.progressTotal - this.progress
      ]);
      const res = creep.transfer(structure, this.srcType, amountToPay);
      this.progress += amountToPay;
      this.status = this.progress / this.progressTotal;
      if (this.status >= 1) {
        this.onComplete(OK);
        return 1;
      } else {
        return res;
      }
    } else {
      // move
      const res = creep.myMoveTo(pos);
      return res;
    }
  }

  constructor(
    priority: number,
    srcType: ResourceConstant,
    amount: number,
    target: GlobalObjInfo<Target>,
    roomName: string,
    handledByKeeper: boolean,
    options: taskOptions<Creep> = {}
  ) {
    super(
      priority,
      srcType,
      amount,
      target,
      handledByKeeper,
      roomName,
      options.action || ((creep: Creep) => this.defaultAction(creep)),
      options.prerequisite || ((creep: Creep) => this.defaultPrerequisite(creep)),
      options.callbacks || []
      );
  }

  /**
   * 
   * @param {ScreepsReturnCode} status whether the task is completed (OK) or failed (ERR_*)
   */
  onComplete(status: ScreepsReturnCode): void {
    Logger.info(`Task by ${this.creepName} complete ${status}`);

    this.callbacks.forEach(f => f(this, status));
    // log task completion
    const msg = [`Pay Task finished with `, status, this];
    switch (status) {
      case OK:
        Logger.trace(...msg);
        break;
      // creep not found
      case ERR_NO_BODYPART:
        Logger.debug(...msg);
        break;

      default:
        Logger.warn(...msg);
        break;
    }
    
    this.unbindTargetStructure().unbindCreep(this.creepName);
    
  }
}