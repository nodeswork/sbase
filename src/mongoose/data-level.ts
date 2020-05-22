import * as _ from 'underscore';
import { DocumentToObjectOptions, Schema, SchemaOptions } from 'mongoose';

import * as model from './model';
import { AsObject } from '../../mongoose';
import { DataLevelConfig } from './model-config';
import { Field } from './';

export type DataLevelModelType = typeof DataLevelModel;

@model.Plugin({
  fn: dataLevelPlugin,
  priority: 100,
})
export class DataLevelModel extends model.DocumentModel {
  public toJSON(options?: DocumentToObjectOptions): AsObject<this> {
    let obj = this.toObject(options);
    if (options && options.level) {
      const fields = _.keys(
        fetchModelFields(
          this.schema.options.dataLevel,
          options.level,
          this.schema.dataLevel.levelMap,
        ),
      );
      obj = deepOmit(obj, fields);
    }
    return obj;
  }
}

function deepOmit(obj: any, fields: string[]): any {
  if (_.isArray(obj)) {
    return _.map(obj, (o) => deepOmit(o, fields));
  }

  const grouped = _.groupBy(fields, (f) => (f.indexOf('.') === -1 ? 1 : 0));
  if (grouped[1]) {
    obj = _.omit(obj, ...grouped[1]);
  }
  if (grouped[0]) {
    const goal: any = _.chain(grouped[0])
      .map((v) => {
        const idx = v.indexOf('.');
        return [v.substr(0, idx), v.substring(idx + 1)];
      })
      .groupBy((pair) => pair[0])
      .mapObject((pairs) => _.map(pairs, (p) => p[1]))
      .value();
    _.each(goal, (fs: string[], name: string) => {
      if (obj && obj[name]) {
        obj[name] = deepOmit(obj[name], fs);
      }
    });
  }
  return obj;
}

function dataLevelPlugin(schema: Schema, options: SchemaOptions) {
  if (schema.dataLevel != null) {
    return;
  }
  if (options == null) {
    options = schema.options;
  }

  const dataLevelOptionsLevels = _.values(
    (options.dataLevel && options.dataLevel.levels) || [],
  );

  schema.dataLevel = {
    levelMap: {},
  };

  _.each((schema as any).paths, (st: any, path: string) => {
    if (st && st.schema) {
      dataLevelPlugin(st.schema, options);
    }
  });

  addToLevelMap(schema, levelPaths(schema));

  for (const name of model.preQueries) {
    schema.pre(name, modifyProjection);
  }
}

function modifyProjection(next: () => void) {
  const schema: Schema = this.schema;
  if (!schema.options || !schema.options.dataLevel) {
    next();
    return;
  }

  const levels = _.values(schema.options.dataLevel.levels);

  const level =
    this.options.level ||
    (schema.options.dataLevel && schema.options.dataLevel.default);

  if (level) {
    if (this._fields == null) {
      this._fields = {};
    }

    if (
      _.findIndex(_.values(this._fields), (x: any) => x === true || x === 1) ===
      -1
    ) {
      const projectedFields = fetchModelFields(
        schema.options.dataLevel,
        level,
        schema.dataLevel.levelMap,
      );
      _.extend(this._fields, projectedFields);
    }
  }
  next();
}

function fetchModelFields(
  config: DataLevelConfig,
  level: string,
  levelMap: { [name: string]: string[] },
): object {
  if (config._levelsMap == null) {
    config._levelsMap = {};
  }
  if (config._levelsMap[level]) {
    return config._levelsMap[level];
  }

  const fields: string[] = [];

  let valid = false;

  _.each(_.values(config.levels), (l: string) => {
    if (valid) {
      _.each(levelMap[l], (p: string) => {
        fields.push(p);
      });
    }
    if (l === level) {
      valid = true;
    }
  });

  const filtered: string[] = _.filter(fields, (target) => {
    return _.all(fields, (r) => {
      return target.indexOf(r + '.') !== 0;
    });
  });

  const result: any = {};
  _.each(filtered, (f) => {
    result[f] = 0;
  });

  config._levelsMap[level] = result;

  return result;
}

function addToLevelMap(schema: Schema, lps: LevelPath[]) {
  const dataLevelOptionsLevels = _.values(
    (schema.options.dataLevel && schema.options.dataLevel.levels) || [],
  );
  const levelMap = schema.dataLevel.levelMap;

  for (const { path, level } of lps) {
    levelMap[level] = _.union(levelMap[level], [path]);
  }

  _.each((schema as any).paths, (st: any, path: string) => {
    if (st && st.schema) {
      const s: Schema = st.schema;
      _.each(s.dataLevel.levelMap, (ps, l) => {
        levelMap[l] = _.union(
          levelMap[l],
          _.map(ps, (p) => `${path}.${p}`),
        );
      });
    }
  });
}

function levelPaths(schema: Schema): LevelPath[] {
  const res: LevelPath[] = [];
  schema.eachPath((pathname, schemaType) => {
    if (pathname.indexOf('$*') >= 0) {
      return;
    }
    const level = (schemaType as any).options.level;

    if (level != null) {
      res.push({ path: pathname, level });
    }
  });
  return res;
}

interface LevelPath {
  path: string;
  level: string;
}

export function Level(level: string, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      level,
    }),
  );
}
