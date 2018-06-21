import * as _                                             from 'underscore';
import { DocumentToObjectOptions, Schema, SchemaOptions } from 'mongoose';

import * as model                                         from './model';
import { ToJSONOption }                                   from './model-config';

export const MINIMAL = 'MINIMAL';
export const MAXIMAL = 'MAXIMAL';

export type DataLevelModelType = typeof DataLevelModel;

@model.Plugin({
  fn:        dataLevelPlugin,
  priority:  100,
})
export class DataLevelModel extends model.Model {

  public toJSON(options?: DocumentToObjectOptions): object {
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

function dataLevelPlugin(schema: Schema, options: SchemaOptions) {
  if (schema.dataLevel == null) {
    schema.dataLevel = {
      levelMap: {},
    };
  }

  // schema.levels = [ MINIMAL ].concat(options.levels || []);
  addToLevelMap(schema, levelPaths(schema));

  for (const name of model.preQueries) {
    schema.pre(name, modifyProjection);
  }
}

function modifyProjection(next: () => void) {
  const schema: Schema = this.schema;
  const level = (
    this.options.level ||
    schema.options.dataLevel && schema.options.dataLevel.default
  );

  if (level) {
    const fields = schema.dataLevel.levelMap[level] || [];

    if (this._fields == null) {
      this._fields = {};
    }

    for (const field of fields) {
      this._fields[field] = 1;
    }
  }
  next();
}

function addToLevelMap(schema: Schema, lps: LevelPath[]) {
  if (schema.parentSchema) {
    addToLevelMap(schema.parentSchema, lps);
  }

  const dataLevelOptionsLevels = _.values(
    schema.options.dataLevel && schema.options.dataLevel.levels || [],
  );
  const levelMap = schema.dataLevel.levelMap;

  for (const {path, level} of lps) {
    for (
      let levelIndex = (
        level === MINIMAL ? 0 : dataLevelOptionsLevels.indexOf(level)
      );
      levelIndex >= 0 && levelIndex < dataLevelOptionsLevels.length;
      levelIndex++
    ) {
      const cLevel = dataLevelOptionsLevels[levelIndex];
      levelMap[cLevel] = _.union(levelMap[cLevel], [path]);
    }

    if (level === MINIMAL) {
      levelMap[MINIMAL] = _.union(levelMap[MINIMAL], [path]);
    }
    levelMap[MAXIMAL] = _.union(levelMap[MAXIMAL], [path]);
  }
}

function levelPaths(schema: Schema): LevelPath[] {
  const res: LevelPath[] = [];
  schema.eachPath((pathname, schemaType) => {
    res.push({
      path: pathname,
      level: (schemaType as any).options.level || MINIMAL,
    });
  });
  return res;
}

interface LevelPath {
  path:   string;
  level:  string;
}
