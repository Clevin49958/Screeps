import { expect } from "chai";
import { describe, it } from "mocha";
import { BALANCED, CLAIMER } from "../src/globalClasses";
import { SpawnTaskBuilder } from "../src/spawnTask";

describe('SpawnTaskBuilder', () => {
  describe('Count getter', ()=> {
    it('residual case', () => {
      expect(SpawnTaskBuilder.getBody(BALANCED, 250)).to.equal([MOVE, WORK, CARRY]);
      expect(SpawnTaskBuilder.getBody(CLAIMER, 900)).equal([MOVE, CLAIM])
    })
  })
})