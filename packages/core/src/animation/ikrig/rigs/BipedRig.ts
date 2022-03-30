import { Armature, Pose } from "../../armature";
import { BoneMap, BoneChain, BoneInfo } from "../../armature/BoneMap";
import { SwingTwistEndsSolver, SwingTwistSolver, LimbSolver, HipSolver } from "../solvers";

import { IKChain } from "./IKChain";
import { IKRig } from "./IKRig";
import { Vector3 } from "@arche-engine/math";

export class BipedRig extends IKRig {
  hip?: IKChain = undefined;
  spine?: IKChain = undefined;
  neck?: IKChain = undefined;
  head?: IKChain = undefined;
  armL?: IKChain = undefined;
  armR?: IKChain = undefined;
  legL?: IKChain = undefined;
  legR?: IKChain = undefined;
  handL?: IKChain = undefined;
  handR?: IKChain = undefined;
  footL?: IKChain = undefined;
  footR?: IKChain = undefined;

  /** Try to find all the bones for each particular chains */
  autoRig(arm: Armature): boolean {
    // Standard Bone Map, Easier to find bones using common names.
    const map = new BoneMap(arm);
    // Are All the Parts of the AutoRigging found?
    let isComplete = true;
    let b: BoneInfo | BoneChain | undefined;
    let bi: BoneInfo;
    let n: string;
    const names: string[] = [];

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // VERY IMPORTANT : The order of the chains should not change in this
    // structure, it will determine the order in which the solvers will be
    // called. Certain chains should be called before others, like Hip Before Legs or Arms
    const chains = [
      { n: "hip", ch: ["hip"] },
      { n: "spine", ch: ["spine"] },
      { n: "legL", ch: ["thigh_l", "shin_l"] },
      { n: "legR", ch: ["thigh_r", "shin_r"] },
      { n: "armL", ch: ["upperarm_l", "forearm_l"] },
      { n: "armR", ch: ["upperarm_r", "forearm_r"] },
      { n: "neck", ch: ["neck"] },
      { n: "head", ch: ["head"] },
      { n: "handL", ch: ["hand_l"] },
      { n: "handR", ch: ["hand_r"] },
      { n: "footL", ch: ["foot_l"] },
      { n: "footR", ch: ["foot_r"] }
    ];

    // TypeScript doesn't like "this[ n ] = this.add", using this type lets me get away with it.
    const self: { [k: string]: any } = this;

    for (const itm of chains) {
      // Name of Chain
      n = itm.n;
      // Reset Bone Name Array
      names.length = 0;

      // Find all bone names assigned to this chain.
      for (let i = 0; i < itm.ch.length; i++) {
        // Get Find Bone Reference
        b = map.bones.get(itm.ch[i]);

        // Not Found, Exit loop to work on next chain.
        if (!b) {
          console.log("AutoRig - Missing ", itm.ch[i]);
          isComplete = false;
          break;
        }

        if (b instanceof BoneInfo) names.push(b.name);
        else if (b instanceof BoneChain) for (bi of b.items) names.push(bi.name);
      }

      // Add Chain to Rig & assign chain to Rig's property of the same name.
      self[n] = this.add(arm, n, names);
    }

    this._setAltDirection(arm);
    return isComplete;
  }

  /** Use Solver Configuration for Retargeting Animation */
  useSolversForRetarget(pose?: Pose): this {
    this.hip?.setSolver(new HipSolver().initData(pose, this.hip));
    this.head?.setSolver(new SwingTwistSolver().initData(pose, this.head));
    this.armL?.setSolver(new LimbSolver().initData(pose, this.armL));
    this.armR?.setSolver(new LimbSolver().initData(pose, this.armR));
    this.legL?.setSolver(new LimbSolver().initData(pose, this.legL));
    this.legR?.setSolver(new LimbSolver().initData(pose, this.legR));
    this.footL?.setSolver(new SwingTwistSolver().initData(pose, this.footL));
    this.footR?.setSolver(new SwingTwistSolver().initData(pose, this.footR));
    this.handL?.setSolver(new SwingTwistSolver().initData(pose, this.handL));
    this.handR?.setSolver(new SwingTwistSolver().initData(pose, this.handR));
    this.spine?.setSolver(new SwingTwistEndsSolver().initData(pose, this.spine));

    return this;
  }

  /** Use Solver Configuration for Fullbody IK */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useSolversForFBIK(pose?: Pose): this {
    // this.hip?.setSolver( new HipSolver().initData( pose, this.hip ) );
    // this.head?.setSolver( new SwingTwistSolver().initData( pose, this.head ) );
    // this.armL?.setSolver( new LimbSolver().initData( pose, this.armL ) );
    // this.armR?.setSolver( new LimbSolver().initData( pose, this.armR ) );
    // this.legL?.setSolver( new LimbSolver().initData( pose, this.legL ) );
    // this.legR?.setSolver( new LimbSolver().initData( pose, this.legR ) );
    // this.footL?.setSolver( new SwingTwistSolver().initData( pose, this.footL ) );
    // this.footR?.setSolver( new SwingTwistSolver().initData( pose, this.footR ) );
    // this.handL?.setSolver( new SwingTwistSolver().initData( pose, this.handL ) );
    // this.handR?.setSolver( new SwingTwistSolver().initData( pose, this.handR ) );
    // this.spine?.setSolver( new SwingTwistChainSolver().initData( pose, this.spine ) );
    return this;
  }

  /** Setup Chain Data & Sets Alt Directions */
  bindPose(pose: Pose): this {
    // Copy the Local Space Transform of starting Pose to All Chained Bones
    super.bindPose(pose);
    // Set Alt Direction from starting pose
    this._setAltDirection(pose);
    return this;
  }

  _setAltDirection(pose: any): void {
    const FWD = new Vector3(0, 0, 1);
    const UP = new Vector3(0, 1, 0);
    const DN = new Vector3(0, -1, 0);
    const R = new Vector3(-1, 0, 0);
    const L = new Vector3(1, 0, 0);
    const BAK = new Vector3(0, 0, -1);

    if (this.hip) this.hip.bindAltDirections(pose, FWD, UP);
    if (this.spine) this.spine.bindAltDirections(pose, UP, FWD);
    if (this.neck) this.neck.bindAltDirections(pose, FWD, UP);
    if (this.head) this.head.bindAltDirections(pose, FWD, UP);

    if (this.legL) this.legL.bindAltDirections(pose, DN, FWD);
    if (this.legR) this.legR.bindAltDirections(pose, DN, FWD);
    if (this.footL) this.footL.bindAltDirections(pose, FWD, UP);
    if (this.footR) this.footR.bindAltDirections(pose, FWD, UP);

    if (this.armL) this.armL.bindAltDirections(pose, L, BAK);
    if (this.armR) this.armR.bindAltDirections(pose, R, BAK);
    if (this.handL) this.handL.bindAltDirections(pose, L, BAK);
    if (this.handR) this.handR.bindAltDirections(pose, R, BAK);
  }

  resolveToPose(pose: any, debug?: any) {
    let ch: IKChain;
    for (ch of this.items.values()) {
      if (ch.solver) ch.resolveToPose(pose, debug);
    }
  }
}
