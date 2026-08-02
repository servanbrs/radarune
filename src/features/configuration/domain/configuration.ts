export type ConfigurationSource =
  | "ORGANIZATION"
  | "PLATFORM"
  | "ENVIRONMENT"
  | "DEFAULT";

export type ResolvedConfiguration<T> = {
  value: T;
  source: ConfigurationSource;
  cached: boolean;
};

export type ConfigurationParser<T> = (value: unknown) => T | undefined;

