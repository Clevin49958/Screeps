export const TERMINAL_MINERAL_THRESHOLD = 10000;
export const TERMINAL_ENERGY_THRESHOLD = 20000;
export const THRESHOLD_RATIO = 0.75;
export const LAB_ENERGY_THRESHOLD = LAB_ENERGY_CAPACITY * THRESHOLD_RATIO;
export const LAB_MINERAL_THRESHOLD = LAB_MINERAL_CAPACITY * THRESHOLD_RATIO;
export const CREEP_LIFE_THRESHOLD = 300;
export const MEMORY_UPDATE_PERIOD = 50;

export const BACKUP_MEMORY = false;
export const TESTROOMS: string[] = [/* 'E48S45' */];

global.config = {
  pixel: false,
}