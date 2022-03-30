import { Armature, Pose } from "../armature";
import { SpringItem } from "./SpringItem";
import { SpringChain } from "./SpringChain";

export interface ISpringType {
  setRestPose(chain: SpringChain, pose: Pose, resetSpring: boolean, debug?: any): void;

  updatePose(chain: SpringChain, pose: Pose, dt: number, debug?: any): void;
}

export class BoneSpring {
  arm: Armature;
  items: Map<string, SpringChain> = new Map();

  constructor(arm: Armature) {
    this.arm = arm;
  }

  addRotChain(chName: string, bNames: string[], osc: number = 5.0, damp: number = 0.5): this {
    // Rotation Spring Chain
    const chain = new SpringChain(chName, 0);
    // Setup Chain
    chain.setBones(bNames, this.arm, osc, damp);
    // Save
    this.items.set(chName, chain);
    return this;
  }

  addPosChain(chName: string, bNames: string[], osc: number = 5.0, damp: number = 0.5): this {
    // Position Spring Chain
    const chain = new SpringChain(chName, 1);
    // Setup Chain
    chain.setBones(bNames, this.arm, osc, damp);
    // Save
    this.items.set(chName, chain);
    return this;
  }

  setRestPose(pose: Pose, resetSpring: boolean = true, debug?: any): this {
    let ch: SpringChain;
    for (ch of this.items.values()) {
      ch.setRestPose(pose, resetSpring, debug);
    }
    return this;
  }

  updatePose(dt: number, pose: Pose, doWorldUpdate: false, debug?: any): this {
    let ch: SpringChain;
    for (ch of this.items.values()) {
      ch.updatePose(dt, pose, debug);
    }

    if (doWorldUpdate) pose.updateWorld(true);
    return this;
  }

  /** Set Oscillation Per Section for all Chain Items */
  setOsc(chName: string, osc: number): this {
    const ch = this.items.get(chName);
    if (!ch) {
      console.error("Spring Chain name not found", chName);
      return this;
    }

    let si: SpringItem;
    for (si of ch.items) si.spring.setOscPerSec(osc);

    return this;
  }

  /** Spread an Oscillation range on the chain */
  setOscRange(chName: string, a: number, b: number): this {
    const ch = this.items.get(chName);
    if (!ch) {
      console.error("Spring Chain name not found", chName);
      return this;
    }

    const len = ch.items.length - 1;
    let t: number;
    for (let i = 0; i <= len; i++) {
      t = i / len;
      ch.items[i].spring.setOscPerSec(a * (1 - t) + b * t);
    }

    return this;
  }

  setDamp(chName: string, damp: number): this {
    const ch = this.items.get(chName);
    if (!ch) {
      console.error("Spring Chain name not found", chName);
      return this;
    }

    let si: SpringItem;
    for (si of ch.items) si.spring.setDamp(damp);

    return this;
  }

  setDampRange(chName: string, a: number, b: number): this {
    const ch = this.items.get(chName);
    if (!ch) {
      console.error("Spring Chain name not found", chName);
      return this;
    }

    const len = ch.items.length - 1;
    let t: number;
    for (let i = 0; i <= len; i++) {
      t = i / len;
      ch.items[i].spring.setDamp(a * (1 - t) + b * t);
    }

    return this;
  }
}