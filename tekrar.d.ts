declare namespace tekrar {
  type AnyArgs = readonly unknown[];
  type RecoveryFunction<Args extends AnyArgs = AnyArgs> = (
    ...args: Args
  ) => unknown | Promise<unknown>;
  type ErrorHandler = (error: Error) => void;
  interface Options<Args extends AnyArgs = AnyArgs> {
    count?: number;
    delay?: number;
    recovery?: RecoveryFunction<Args>;
    onError?: ErrorHandler;
    handleRecovery?: boolean;
  }
  type WrappedFunction<Args extends AnyArgs, Result> = (
    ...args: Args
  ) => Promise<Result>;
}

declare function tekrar<TaskFn extends (...args: any[]) => any>(
  task: TaskFn,
  options?: tekrar.Options<Parameters<TaskFn>>,
): tekrar.WrappedFunction<Parameters<TaskFn>, Awaited<ReturnType<TaskFn>>>;

export = tekrar;
