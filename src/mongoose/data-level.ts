import * as _ from 'underscore'
import { Schema } from 'mongoose'

import * as model from './model'

export const MINIMAL = 'MINIMAL'

export interface ModelConfig {
  levels?:  string[]
}

declare module 'mongoose' {
  interface Schema {
    levelMap?: {
      [name: string]: string[]
    }
    levels: string[]
  }
}

export function dataLevelPlugin(schema: Schema, options: ModelConfig) {
  if (schema.levelMap == null) {
    schema.levelMap = {};
  }
  schema.levels = [ MINIMAL ].concat(options.levels || []);
  addToLevelMap(schema, levelPaths(schema));

  schema.pre('find', modifyProjection);
  schema.pre('findOne', modifyProjection);

}

function modifyProjection(next: Function) {
  if (this.options.level) {
    let schema: Schema = this.schema;
    let index = schema.levels.indexOf(this.options.level);

    if (this._fields == null && index >= 0) {
      this._fields = {};
    }

    for (let i = 0; i <= index; i++) {
      for (let field of schema.levelMap[schema.levels[i]]) {
        this._fields[field] = 1;
      }
    }
  }
  next();
}

function addToLevelMap(schema: Schema, levelPaths: LevelPath[]) {
  if (schema.parentSchema) {
    addToLevelMap(schema.parentSchema, levelPaths);
  }

  for (let {path, level} of levelPaths) {
    schema.levelMap[level] = _.union(
      schema.levelMap[level], [path]
    );
  }
}

function levelPaths(schema: Schema): LevelPath[] {
  let res: LevelPath[] = [];
  schema.eachPath((pathname, schemaType) => {
    res.push({
      path: pathname,
      level: (schemaType as any).options.level || MINIMAL,
    });
  });
  return res;
}

interface LevelPath {
  path:   string
  level:  string
}
