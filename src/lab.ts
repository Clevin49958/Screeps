import { StructureInfo } from "./globalClasses";

export enum LabState {
  OFF,
  REACT,
  DECOMPOSE
}

export enum LabType {
  OFF,
  REACTANT,
  INTERMIDIATE,
  PRODUCT
}

export class labInfo extends StructureInfo<StructureLab> {
  srcType?: ResourceConstant;
  type: LabType;
  state: LabState;
  reactor?: unknown[];
  constructor(structure: AnyStructure) {
    super(structure);
    this.state = LabState.OFF;
    this.type = LabType.OFF;
    this.reactor = [];
  }
}