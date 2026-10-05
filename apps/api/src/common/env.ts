import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Every environment variable this API reads, in one place.
 *
 * Same idea as the request DTOs: a class whose decorators are checked at
 * runtime. Config is validated once at boot, so a bad `PORT` fails immediately
 * with a clear message instead of surfacing as `NaN` somewhere later.
 */
export class Env {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  /** Port the API listens on. 3001 keeps 3000 free for Next.js. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3001;

  /** Origin allowed by CORS — the Next.js dev server by default. */
  @IsString()
  WEB_ORIGIN = 'http://localhost:3000';

  /** Insert demo data on boot. Off in production. */
  // `Boolean('false')` is `true`, so parse the string explicitly rather than
  // letting implicit conversion do it.
  @Transform(({ value }) =>
    value === undefined ? true : value === 'true' || value === true,
  )
  @IsBoolean()
  SEED_DATA = true;
}

/** Passed to `ConfigModule.forRoot({ validate })`. */
export function validateEnv(raw: Record<string, unknown>): Env {
  // Copy across only the keys declared above — the process environment is full
  // of unrelated variables — and skip blank ones. Handing `undefined` or `''`
  // to plainToInstance would overwrite the defaults and then fail validation,
  // so `PORT=` in a .env file would break boot instead of meaning "default".
  const provided: Record<string, unknown> = {};
  for (const key of Object.keys(new Env())) {
    const value = raw[key];
    if (value !== undefined && value !== '') provided[key] = value;
  }

  const env = plainToInstance(Env, provided);

  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return env;
}
