import * as _ from 'underscore'
import { DocumentToObjectOptions, Schema } from 'mongoose'

import * as model from './model'
import { ModelConfig, ToJSONOption } from './model-config';

export const MINIMAL = 'MINIMAL';
export const MAXIMAL = 'MAXIMAL';

export type DataLevelModelType = typeof DataLevelModel;
export class DataLevelModel extends model.Model {

  toJSON(options?: DocumentToObjectOptions): object {
    let obj = this.toObject();
    if (options && options.level) {
      const fields = (
        this.schema.dataLevel && this.schema.dataLevel.levelMap[options.level]
        || []
      );
      obj = _.pick(obj, fields);
    }
    return obj;
  }
}

DataLevelModel.Plugin({
  fn: dataLevelPlugin,
  priority: 100,
});

function dataLevelPlugin(schema: Schema, options: ModelConfig) {
  if (schema.dataLevel == null) {
    schema.dataLevel = {
      levelMap: {},
    };
  }

  // schema.levels = [ MINIMAL ].concat(options.levels || []);
  addToLevelMap(schema, levelPaths(schema));

  for (let name of model.preQueries) {
    schema.pre(name, modifyProjection);
  }
}

function modifyProjection(next: Function) {
  let level = this.options.level;

  if (level) {
    let schema: Schema = this.schema;
    let fields = schema.dataLevel.levelMap[level] || [];

    if (this._fields == null) {
      this._fields = {};
    }

    for (let field of fields) {
      this._fields[field] = 1;
    }
  }
  next();
}

function addToLevelMap(schema: Schema, levelPaths: LevelPath[]) {
  if (schema.parentSchema) {
    addToLevelMap(schema.parentSchema, levelPaths);
  }

  let dataLevelOptionsLevels = (
    schema.options.dataLevel && schema.options.dataLevel.levels || []
  );
  let levelMap = schema.dataLevel.levelMap;

  for (let {path, level} of levelPaths) {
    for (
      let levelIndex = (
        level === MINIMAL ? 0 : dataLevelOptionsLevels.indexOf(level)
      );
      levelIndex >= 0 && levelIndex < dataLevelOptionsLevels.length;
      levelIndex++
    ) {
      let cLevel = dataLevelOptionsLevels[levelIndex];
      levelMap[cLevel] = _.union(levelMap[cLevel], [path]);
    }

    if (level === MINIMAL) {
      levelMap[MINIMAL] = _.union(levelMap[MINIMAL], [path]);
    }
    levelMap[MAXIMAL] = _.union(levelMap[MAXIMAL], [path]);
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
