/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_auth from "../_lib/auth.js";
import type * as _lib_errors from "../_lib/errors.js";
import type * as _lib_jwt from "../_lib/jwt.js";
import type * as _lib_password from "../_lib/password.js";
import type * as _lib_publicUser from "../_lib/publicUser.js";
import type * as _lib_usageLimits from "../_lib/usageLimits.js";
import type * as _lib_userInput from "../_lib/userInput.js";
import type * as aiChat from "../aiChat.js";
import type * as chapter from "../chapter.js";
import type * as crons from "../crons.js";
import type * as dailyQuiz from "../dailyQuiz.js";
import type * as http from "../http.js";
import type * as settings from "../settings.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/auth": typeof _lib_auth;
  "_lib/errors": typeof _lib_errors;
  "_lib/jwt": typeof _lib_jwt;
  "_lib/password": typeof _lib_password;
  "_lib/publicUser": typeof _lib_publicUser;
  "_lib/usageLimits": typeof _lib_usageLimits;
  "_lib/userInput": typeof _lib_userInput;
  aiChat: typeof aiChat;
  chapter: typeof chapter;
  crons: typeof crons;
  dailyQuiz: typeof dailyQuiz;
  http: typeof http;
  settings: typeof settings;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
