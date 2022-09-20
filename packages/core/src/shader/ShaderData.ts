import { IClone } from "@arche-engine/design";
import { IRefObject } from "../asset";
import { ShaderDataGroup } from "./ShaderDataGroup";
import { Shader } from "./Shader";
import { ShaderMacro } from "./ShaderMacro";
import { ShaderMacroCollection } from "./ShaderMacroCollection";
import { ShaderProperty } from "./ShaderProperty";
import { Buffer } from "../graphic";
import { Engine } from "../Engine";
import { ImageView } from "../image/ImageView";
import { SamplerDescriptor } from "../webgpu";

export type ShaderPropertyResourceType = Buffer | ImageView | SamplerDescriptor;

/**
 * Shader data collection,Correspondence includes shader properties data and macros data.
 */
export class ShaderData implements IRefObject, IClone {
  private static _defaultSamplerDesc = new SamplerDescriptor();

  /** @internal */
  _group: ShaderDataGroup;
  /** @internal */
  _propertyResources: Record<number, ShaderPropertyResourceType> = Object.create(null);
  /** @internal */
  _propertyFunctors: Record<number, () => Buffer> = Object.create(null);
  /** @internal */
  _macroCollection: ShaderMacroCollection = new ShaderMacroCollection();

  private _macroMap: Record<number, ShaderMacro> = Object.create(null);
  private _refCount: number = 0;
  private readonly _engine: Engine;

  /**
   * @internal
   */
  constructor(group: ShaderDataGroup, engine: Engine) {
    this._engine = engine;
    this._group = group;
  }

  /**
   * Set float by shader property name.
   * @remarks Corresponding float shader property type.
   * @param propertyName - Shader property name
   * @param value - Float
   */
  setBufferFunctor(propertyName: string, value: () => Buffer): void;

  /**
   * Set float by shader property.
   * @remarks Corresponding float shader property type.
   * @param property - Shader property
   * @param value - Float
   */
  setBufferFunctor(property: ShaderProperty, value: () => Buffer): void;

  setBufferFunctor(property: string | ShaderProperty, value: () => Buffer): void {
    if (typeof property === "string") {
      property = Shader.getPropertyByName(property);
    }

    if (property._group !== this._group) {
      if (property._group === undefined) {
        property._group = this._group;
      } else {
        throw `Shader property ${property.name} has been used as ${ShaderDataGroup[property._group]} property.`;
      }
    }

    if (this._propertyResources[property._uniqueId] == undefined) {
      this._propertyFunctors[property._uniqueId] = value;
    }
  }

  //--------------------------------------------------------------------------------------------------------------------
  /**
   * Set float array by shader property name.
   * @remarks Correspondence includes float array、vec2 array、vec3 array、vec4 array and matrix array shader property type.
   * @param propertyName - Shader property name
   * @param value - Float array
   */
  setFloatArray(propertyName: string, value: Float32Array): void;

  /**
   * Set float array by shader property.
   * @remarks Correspondence includes float array、vec2 array、vec3 array、vec4 array and matrix array shader property type.
   * @param property - Shader property
   * @param value - Float array
   */
  setFloatArray(property: ShaderProperty, value: Float32Array): void;

  setFloatArray(property: string | ShaderProperty, value: Float32Array): void {
    this._setDataBuffer(property, value);
  }

  //--------------------------------------------------------------------------------------------------------------------
  /**
   * Set int array by shader property name.
   * @remarks Correspondence includes bool array、int array、bvec2 array、bvec3 array、bvec4 array、ivec2 array、ivec3 array and ivec4 array shader property type.
   * @param propertyName - Shader property name
   * @param value - Int Array
   */
  setIntArray(propertyName: string, value: Int32Array): void;

  /**
   * Set int array by shader property.
   * @remarks Correspondence includes bool array、int array、bvec2 array、bvec3 array、bvec4 array、ivec2 array、ivec3 array and ivec4 array shader property type.
   * @param property - Shader property
   * @param value - Int Array
   */
  setIntArray(property: ShaderProperty, value: Int32Array): void;

  setIntArray(property: string | ShaderProperty, value: Int32Array): void {
    this._setDataBuffer(property, value);
  }

  //------------------------------------------------------------------------------------------------------------------
  /**
   * Set texture by shader property name.
   * @param samplerName - Shader property name
   * @param value - Texture
   */
  setSampler(samplerName: string, value: SamplerDescriptor): void;

  /**
   * Set texture by shader property.
   * @param samplerProperty - Shader property
   * @param value - Texture
   */
  setSampler(samplerProperty: ShaderProperty, value: SamplerDescriptor): void;

  setSampler(samplerProperty: string | ShaderProperty, value: SamplerDescriptor): void {
    this._setSampler(samplerProperty, value);
  }

  /**
   * Set texture by shader property name.
   * @param textureName - Shader property name
   * @param value - Texture
   */
  setStorageImageView(textureName: string, value: ImageView): void;

  /**
   * Set texture by shader property.
   * @param textureProperty - Shader property
   * @param value - Texture
   */
  setStorageImageView(textureProperty: ShaderProperty, value: ImageView): void;

  setStorageImageView(textureProperty: string | ShaderProperty, value: ImageView): void {
    this._setStorageImageView(textureProperty, value);
  }

  /**
   * Set texture by shader property name.
   * @param textureName - Shader property name
   * @param samplerName - Shader property name
   * @param value - Texture
   */
  setImageView(textureName: string, samplerName: string, value: ImageView): void;

  /**
   * Set texture by shader property.
   * @param textureProperty - Shader property
   * @param samplerProperty - Shader property
   * @param value - Texture
   */
  setImageView(textureProperty: ShaderProperty, samplerProperty: ShaderProperty, value: ImageView): void;

  setImageView(
    textureProperty: string | ShaderProperty,
    samplerProperty: string | ShaderProperty,
    value: ImageView
  ): void {
    this._setImageView(textureProperty, samplerProperty, value);
  }

  //--------------------------------------------------------------------------------------------------------------------
  /**
   * Enable macro with name.
   * @param macroName - Macro name
   */
  enableMacro(macroName: string): void;

  /**
   * Enable macro with name and value.
   * @remarks Name and value will combine, it's equal the macro of "name value".
   * @param name - Macro name
   * @param value - Macro value
   */
  enableMacro(name: string, value: string): void;

  /**
   * Enable macro with shaderMacro.
   * @param macro - Shader macro
   */
  enableMacro(macro: ShaderMacro): void;

  enableMacro(macro: string | ShaderMacro, value?: string): void {
    if (typeof macro === "string") {
      macro = Shader.getMacroByName(macro, value);
    }
    const nameID = macro._nameId;
    const lastMacro = this._macroMap[nameID];
    if (lastMacro !== macro) {
      const macroCollection = this._macroCollection;
      lastMacro && macroCollection.disable(lastMacro);
      macroCollection.enable(macro);
      this._macroMap[nameID] = macro;
    }
  }

  /**
   * Disable macro.
   * @param macroName - Macro name
   */
  disableMacro(macroName: string): void;

  /**
   * Disable macro.
   * @param macro - Shader macro
   */
  disableMacro(macro: ShaderMacro): void;

  disableMacro(macro: string | ShaderMacro): void {
    let nameID: number;
    if (typeof macro === "string") {
      nameID = ShaderMacro._macroNameIdMap[macro];
      if (nameID === undefined) {
        return;
      }
    } else {
      nameID = macro._nameId;
    }

    const currentMacro = this._macroMap[nameID];
    if (currentMacro) {
      this._macroCollection.disable(currentMacro);
      delete this._macroMap[nameID];
    }
  }

  /**
   * Get shader macro array that are currently enabled for ShaderData.
   */
  getMacros(): ShaderMacro[];
  /**
   * Get shader macro array that are currently enabled for ShaderData.
   * @param out - Shader macro array
   */
  getMacros(out: ShaderMacro[]): void;

  getMacros(out?: ShaderMacro[]): ShaderMacro[] | void {
    if (out) {
      const macroMap = this._macroMap;
      out.length = 0;
      for (var key in macroMap) {
        out.push(macroMap[key]);
      }
    } else {
      return Object.values(this._macroMap);
    }
  }

  //--------------------------------------------------------------------------------------------------------------------
  /**
   * @internal
   */
  _setDataBuffer(property: string | ShaderProperty, value: Float32Array | Int32Array): void {
    if (typeof property === "string") {
      property = Shader.getPropertyByName(property);
    }

    if (property._group !== this._group) {
      if (property._group === undefined) {
        property._group = this._group;
      } else {
        throw `Shader property ${property.name} has been used as ${ShaderDataGroup[property._group]} property.`;
      }
    }

    if (this._propertyResources[property._uniqueId] == undefined) {
      this._propertyResources[property._uniqueId] = new Buffer(
        this._engine,
        value.byteLength,
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      );
    }
    (<Buffer>this._propertyResources[property._uniqueId]).uploadData(value, 0, 0, value.length);
  }

  /**
   * @internal
   */
  _setImageView(texProperty: string | ShaderProperty, sampleProperty: string | ShaderProperty, value: ImageView): void {
    // texture
    {
      if (typeof texProperty === "string") {
        texProperty = Shader.getPropertyByName(texProperty);
      }

      if (texProperty._group !== this._group) {
        if (texProperty._group === undefined) {
          texProperty._group = this._group;
        } else {
          throw `Shader property ${texProperty.name} has been used as ${ShaderDataGroup[texProperty._group]} property.`;
        }
      }

      if (this._propertyResources[texProperty._uniqueId] == undefined) {
        this._propertyResources[texProperty._uniqueId] = value;
      }
    }
    // sampler
    {
      if (typeof sampleProperty === "string") {
        sampleProperty = Shader.getPropertyByName(sampleProperty);
      }

      if (sampleProperty._group !== this._group) {
        if (sampleProperty._group === undefined) {
          sampleProperty._group = this._group;
        } else {
          throw `Shader property ${sampleProperty.name} has been used as ${
            ShaderDataGroup[sampleProperty._group]
          } property.`;
        }
      }

      if (this._propertyResources[sampleProperty._uniqueId] == undefined) {
        this._propertyResources[sampleProperty._uniqueId] = ShaderData._defaultSamplerDesc;
      }
    }
  }

  /**
   * @internal
   */
  _setStorageImageView(texProperty: string | ShaderProperty, value: ImageView): void {
    if (typeof texProperty === "string") {
      texProperty = Shader.getPropertyByName(texProperty);
    }

    if (texProperty._group !== this._group) {
      if (texProperty._group === undefined) {
        texProperty._group = this._group;
      } else {
        throw `Shader property ${texProperty.name} has been used as ${ShaderDataGroup[texProperty._group]} property.`;
      }
    }

    this._propertyResources[texProperty._uniqueId] = value;
  }

  /**
   * @internal
   */
  _setSampler(sampleProperty: string | ShaderProperty, value: SamplerDescriptor): void {
    if (typeof sampleProperty === "string") {
      sampleProperty = Shader.getPropertyByName(sampleProperty);
    }

    if (sampleProperty._group !== this._group) {
      if (sampleProperty._group === undefined) {
        sampleProperty._group = this._group;
      } else {
        throw `Shader property ${sampleProperty.name} has been used as ${
          ShaderDataGroup[sampleProperty._group]
        } property.`;
      }
    }

    this._propertyResources[sampleProperty._uniqueId] = value;
  }

  //--------------------------------------------------------------------------------------------------------------------
  clone(): ShaderData {
    const shaderData = new ShaderData(this._group, this._engine);
    this.cloneTo(shaderData);
    return shaderData;
  }

  cloneTo(target: ShaderData): void {
    // todo
  }

  /**
   * @internal
   */
  _getRefCount(): number {
    return this._refCount;
  }

  /**
   * @internal
   */
  _addRefCount(value: number): void {
    this._refCount += value;
    const properties = this._propertyResources;
    for (const k in properties) {
      const property = properties[k];
    }
  }
}
