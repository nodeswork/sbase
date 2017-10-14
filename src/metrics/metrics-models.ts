import * as _                           from 'underscore';
import * as mongoose                    from 'mongoose';

import { metrics as m, NodesworkError } from '@nodeswork/utils';

import * as sMongoose                   from '../mongoose';

export type MetricsModelType = typeof MetricsModel & sMongoose.ModelType;

export class MetricsModel extends sMongoose.Model implements m.MetricsData {

  @sMongoose.Field({
    type:     mongoose.Schema.Types.Date,
    default:  Date.now,
  })
  public ts: Date;

  @sMongoose.Field({
    type:     mongoose.Schema.Types.Mixed,
    default:  {},
  })
  public dimensions: m.Dimensions;

  @sMongoose.Field({
    type:     mongoose.Schema.Types.Mixed,
    default:  {},
  })
  public metrics: m.Metrics;

  public static async upsertMetrics(
    options: SetMetricsOptions,
  ) : Promise<MetricsModel> {
    const data = m.operator.updateMetricsData(
      options.dimensions, options.name, options.value,
    );

    const updateDoc: { [name: string]: any; } = {};

    for (const dhash of Object.keys(data.dimensions)) {
      updateDoc[`dimensions.${dhash}`] = data.dimensions[dhash];
    }

    for (const mName of Object.keys(data.metrics)) {
      const mValues = data.metrics[mName];
      for (const dhash of Object.keys(mValues)) {
        updateDoc[`metrics.${mName}.${dhash}`] = mValues[dhash];
      }
    }

    const self = this.cast<MetricsModel>();
    return await self.findByIdAndUpdate(options.id, { $set: updateDoc }, {
      new:     true,
      upsert:  true,
    });
  }

  public appendMetrics(options: MetricsOptions) {
    m.operator.updateMetricsData(
      options.dimensions, options.name, options.value, this,
    );
    this.markModified('dimensions');
    this.markModified('metrics');
  }

  public static async appendMetrics(
    options: SetMetricsOptions,
  ) : Promise<MetricsModel> {
    const self = this.cast<MetricsModel>();

    const metrics = await self.findById(options.id);

    if (metrics == null) {
      return await this.createMetrics({ metrics: [options] });
    } else {
      m.operator.updateMetricsData(
        options.dimensions, options.name, options.value, metrics,
      );
      return await metrics.save();
    }
  }

  public static async createMetrics<T extends MetricsModel>(
    options: CreateMetricsOptions,
  ): Promise<T> {
    const self      = this.cast<MetricsModel>();
    const doc: any  = _.extend({}, options.doc, {
      dimensions: {},
      metrics: {},
    });
    if (options.ts) { doc.ts = options.ts; }

    if (options.metrics && options.metrics.length) {
      for (const mo of options.metrics) {
        m.operator.updateMetricsData(
          mo.dimensions, mo.name, mo.value, doc,
        );
      }
    }

    return (await self.create(doc as object)) as T;
  }

  public static async searchMetrics<T extends MetricsModel>(
    options: MetricsSearchOptions,
  ): Promise<T[]> {
    const self                    = this.cast<MetricsModel>();
    const query: any              = _.extend({}, options.query);
    const project: any            = _.extend({}, options.project);

    const dimensions: string[]    = _.flatten([options.dimensions || []]);
    const metricsNames: string[]  = _.flatten([options.metrics || []]);

    query.ts = {
      $gte: options.timerange.start,
      $lt:  options.timerange.end,
    };

    project.dimensions = 1;
    if (metricsNames.length > 0) {
      for (const mName of metricsNames) {
        project[`metrics.${mName}`] = 1;
      }
    }

    const result = await self.find(query, project, options.queryOptions);

    for (const v of result) {
      _.defaults(v, { dimensions: {}, metrics: {} });
      const nd = m.operator.projectMetricsData(v, {
        dimensions,
        metrics: metricsNames,
      });
      _.extend(v, nd);
    }

    return result as T[];
  }

  public static async aggregateMetrics(
    options: AggregateMetricsOptions,
  ): Promise<AggregatedMetrics[]> {
    const metricsModels = await this.searchMetrics(options);

    const result: AggregatedMetrics[] = [];

    return _
      .chain(metricsModels)
      .filter((model) => model.dimensions == null || model.metrics == null)
      .groupBy((model) => {
        return Math.floor(model.ts.getTime() / options.granularityInSecond);
      })
      .map((ms: MetricsModel[], startTime: number) => {
        const merged = m.operator.mergeMetricsData(ms);

        return {
          timerange: {
            start: new Date(startTime),
            end:   new Date(startTime + options.granularityInSecond),
          },
          dimensions: merged.dimensions,
          metrics:    merged.metrics,
        };
      })
      .value();
  }
}

export interface AggregatedMetrics extends m.MetricsData {
  timerange:  {
    start:    Date;
    end:      Date;
  };
}

export interface CreateMetricsOptions {
  ts?:       Date;
  metrics?:  MetricsOptions[];
  doc?:      object;
}

export interface MetricsOptions {
  dimensions?: m.MetricsDimensions;
  name:        string;
  value:       m.MetricsValue<any>;
}

export interface MetricsSearchOptions {
  timerange:      {
    start:        Date;
    end:          Date;
  };

  query?:         object;
  project?:       object;
  queryOptions?:  object;

  dimensions?:    string | string[];
  metrics?:       string | string[];
}

export interface AggregateMetricsOptions extends MetricsSearchOptions {
  ids?:                 boolean;
  granularityInSecond:  number;
}

export interface SetMetricsOptions extends MetricsOptions {
  id:           string;
}
