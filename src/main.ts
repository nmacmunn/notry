class Carrier<T> {
  constructor(public val: T, public exception: unknown = undefined) {}
}

/**
 * Type of the `quit` parameter passed by `notry` to its `quitable` parameter.
 */
export interface Quit<N> {
  (val: N): never;
  if(cond: unknown, val: N): asserts cond;
  catch<R, Args extends unknown[]>(
    fn: (...args: Args) => R,
    ...args: [...Args, N]
  ): R;
}

const quit = Object.assign(
  (val: unknown) => {
    throw new Carrier(val);
  },
  {
    if: (cond: unknown, val: unknown) => {
      if (cond) {
        throw new Carrier(val);
      }
    },
    catch: <R, Args extends unknown[]>(
      fn: (...args: Args) => R,
      ...args: [...Args, unknown]
    ) => {
      const val = args.pop();
      try {
        const result = fn(...(args as any));
        if (result instanceof Promise) {
          return result.catch((exception: unknown) => {
            throw new Carrier(val, exception);
          }) as R;
        }
        return result;
      } catch (exception) {
        throw new Carrier(val, exception);
      }
    },
  }
);

/**
 * Discriminated union used to represent the success or failure of a function
 * called with `notry`.
 */
export type Did<Y, N> =
  | { ok: true; y: Y }
  | { ok: false; n: N; exception: unknown };

type NoTryRet<Y, N> = [Y] extends [never]
  ? Did<Y, N>
  : Y extends Promise<unknown>
  ? Promise<Did<Awaited<Y>, Awaited<N>>>
  : Did<Y, N>;

/**
 * Extract the error type from a quitable function.
 */
export type Of<T> = T extends (quit: Quit<infer U>, ...rest: any) => any
  ? U
  : never;

interface Quitable<Y, N, Args extends unknown[]> {
  (quit: Quit<N>, ...args: Args): Y;
}

/**
 * Run `quitable` with the specified `args`.
 *
 * Returns `Promise<Did<Y, N>>` if `quitable` returns a promise, otherwise
 * returns `Did<Y, N>`.
 */
export function notry<Y, N, Args extends unknown[]>(
  quitable: Quitable<Y, N, Args>,
  ...args: Args
): NoTryRet<Y, N> {
  // called when op throws or rejects
  function onCatch(exceptionVar: unknown) {
    if (exceptionVar instanceof Carrier) {
      return {
        ok: false,
        n: exceptionVar.val,
        exception: exceptionVar.exception,
      };
    }
    throw exceptionVar;
  }
  try {
    const y = quitable(quit, ...args);
    if (y instanceof Promise) {
      // async success or fail
      return y.then((y) => ({ ok: true, y })).catch(onCatch) as NoTryRet<Y, N>;
    } else {
      // sync success
      return { ok: true, y } as NoTryRet<Y, N>;
    }
  } catch (exceptionVar) {
    // sync fail
    return onCatch(exceptionVar) as NoTryRet<Y, N>;
  }
}
