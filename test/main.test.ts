import { describe, expect, test } from "@jest/globals";
import { notry, type Did, type Quit } from "../src/main";

//
// TYPES
//
() => {
  //
  // quit
  //
  notry((quit) => quit("error")) satisfies Did<never, string>;
  // @ts-expect-error: wrong arg type
  notry((quit) => quit(0)) satisfies Did<never, string>;
  // @ts-expect-error: missing quit arg
  notry((quit) => quit());
  notry((quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Did<boolean, boolean>;
  notry((quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Did<true, false>;
  // @ts-expect-error: wrong Y
  notry((quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Did<false, false>;
  // @ts-expect-error: wrong N
  notry((quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Did<true, true>;
  notry((quit, val) => val > 0.5 ? true : quit(false), Math.random()) satisfies Did<true, false>;
  // @ts-expect-error: missing notry arg
  notry((quit, val) => val > 0.5 ? true : quit(false)) satisfies Did<true, false>;

  notry(async (quit) => quit("error")) satisfies Promise<Did<never, string>>;
  // @ts-expect-error: wrong arg type
  notry(async (quit) => quit(0)) satisfies Promise<Did<never, string>>;
  // @ts-expect-error: missing arg
  notry(async (quit) => quit());
  notry(async (quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Promise<Did<boolean, boolean>>;
  // @ts-expect-error: wrong Y
  notry(async (quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Promise<Did<false, false>>;
  // @ts-expect-error: wrong N  just updaing signal
  notry(async (quit) => Math.random() > 0.5 ? true : quit(false)) satisfies Promise<Did<true, true>>;
  notry(async (quit, val) => val > 0.5 ? true : quit(false), Math.random()) satisfies Promise<Did<boolean, false>>;
  // @ts-expect-error: missing notry arg
  notry(async (quit, val) => val > 0.5 ? true : quit(false)) satisfies Promise<Did<boolean, false>>

  //
  // quit.if
  //
  notry((quit) => quit.if(Math.random() > 0.5, true)) satisfies Did<void, true>;
  notry(async (quit) => quit.if(Math.random() > 0.5, true)) satisfies Promise<Did<void, true>>;

  //
  // quit.catch
  //
  notry((quit) => quit.catch(() => {}, true)) satisfies Did<void, true>;
  // @ts-expect-error
  notry((quit) => quit.catch(() => {}, true)) satisfies Did<void, false>;
  notry((quit) => quit.catch(async () => {}, true)) satisfies Promise<Did<void, true>>;
  // @ts-expect-error
  notry((quit) => quit.catch(async () => {}, true)) satisfies Promise<Did<void, false>>;
  notry((quit) => quit.catch((val: boolean) => val, true, true)) satisfies Did<boolean, true>;
  // @ts-expect-error
  notry((quit) => quit.catch((val: boolean) => val, true, true)) satisfies Did<true, true>;
  notry((quit) => quit.catch(async (val: boolean) => val, true, true)) satisfies Promise<Did<boolean, true>>;
  // @ts-expect-error
  notry((quit) => quit.catch(async (val: boolean) => val, true, true)) satisfies Promise<Did<true, true>>;

  //
  // Did
  //
  const did = notry((quit: Quit<false>) => true as const);

  //
  // Assignability
  //
  function neverFail(quit: Quit<never>) {}
  function trueFail(quit: Quit<true>) {}
  function falseFail(quit: Quit<false>) {}
  function boolFail(quit: Quit<boolean>) {}

  notry((quit: Quit<never>) => { neverFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<never>) => { trueFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<never>) => { falseFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<never>) => { boolFail(quit) });

  notry((quit: Quit<true>) => { neverFail(quit) });
  notry((quit: Quit<true>) => { trueFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<true>) => { falseFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<true>) => { boolFail(quit) });

  notry((quit: Quit<false>) => { neverFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<false>) => { trueFail(quit) });
  notry((quit: Quit<false>) => { falseFail(quit) });
  // @ts-expect-error
  notry((quit: Quit<false>) => { boolFail(quit) });

  notry((quit: Quit<boolean>) => { neverFail(quit) });
  notry((quit: Quit<boolean>) => { trueFail(quit) });
  notry((quit: Quit<boolean>) => { falseFail(quit) });
  notry((quit: Quit<boolean>) => { boolFail(quit) });
};

//
// RUNTIME
//

describe("notry", () => {
  test("should return a did", () => {
    const did = notry(() => true);
    expect(did.ok && did.y).toBe(true);
  });
  test("should return an async did", async () => {
    const did = await notry(async () => true);
    expect(did.ok && did.y).toBe(true);
  });
  test("should accept args", () => {
    const did = notry((quit, val) => val, true);
    expect(did.ok && did.y).toBe(true);
  });
  test("should accept async args", async () => {
    const did = await notry(async (quit, val) => val,  true);
    expect(did.ok && did.y).toBe(true);
  });
  test("should not catch unknown errors", () => {
    const e = new Error();
    expect(() =>
      notry(
        () => {
          throw e;
        }
      )
    ).toThrow(e);
  });
  test("should not catch unknown rejections", async () => {
    expect.assertions(1);
    const e = new Error();
    try {
      await notry(
        async () => {
          throw e;
        }
      );
    } catch (caught) {
      expect(caught).toBe(e);
    }
  });
  describe("quit", () => {
    test("should return did.n", () => {
      const did = notry((quit) => quit("fail"));
      expect(!did.ok && did.n).toBe("fail");
    });
    test("should asynchronously did.n", async () => {
      const did = await notry(async (quit) => quit("fail"));
      expect(!did.ok && did.n).toBe("fail");
    });
  });
  describe("quit.if", () => {
    test("should return did.n if condition is true", () => {
      const did = notry((quit) => quit.if(true, "fail"));
      expect(!did.ok && did.n).toBe("fail");
    });
    test("should return did.y if condition is false", () => {
      const did = notry((quit) => quit.if(false, "fail"));
      expect(did.ok && did.y).toBe(undefined);
    });
  });
  describe("quit.catch", () => {
    test("should return did.n if function throws", () => {
      const exception = {};
      const did = notry((quit) => quit.catch(() => { throw exception }, "fail"));
      expect(!did.ok && did.n).toBe("fail");
    });
    test("should return the exception if function throws", () => {
      const exception = {};
      const did = notry((quit) => quit.catch(() => { throw exception }, "fail"));
      expect(!did.ok && did.exception).toBe(exception);
    });
    test("should return did.y if function does not throw", () => {
      const did = notry((quit) => quit.catch(() => "pass", "fail"));
      expect(did.ok && did.y).toBe("pass");
    });
    test("should pass arguments to the function", () => {
      const did = notry((quit) => quit.catch((val) => val, "pass", "fail"));
      expect(did.ok && did.y).toBe("pass");
    });

    test("should return did.n asynchronously if function throws", async () => {
      const exception = {};
      const did = await notry((quit) => quit.catch(async () => { throw exception }, "fail"));
      expect(!did.ok && did.n).toBe("fail");
    });
    test("should return the exception asynchronously if function throws", async () => {
      const exception = {};
      const did = await notry((quit) => quit.catch(async () => { throw exception }, "fail"));
      expect(!did.ok && did.exception).toBe(exception);
    });
    test("should return did.y asynchronously if function does not throw", async () => {
      const did = await notry((quit) => quit.catch(async () => "pass", "fail"));
      expect(did.ok && did.y).toBe("pass");
    });
    test("should pass arguments to the function asynchronously", async () => {
      const did = await notry((quit) => quit.catch(async (val) => val, "pass", "fail"));
      expect(did.ok && did.y).toBe("pass");
    });
  });

});
