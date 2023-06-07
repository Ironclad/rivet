"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ArrayNodeImpl: () => ArrayNodeImpl,
  AssemblePromptNodeImpl: () => AssemblePromptNodeImpl,
  BrowserNativeApi: () => BrowserNativeApi,
  ChatNodeImpl: () => ChatNodeImpl,
  ChunkNodeImpl: () => ChunkNodeImpl,
  CoalesceNodeImpl: () => CoalesceNodeImpl,
  CodeNodeImpl: () => CodeNodeImpl,
  ContextNodeImpl: () => ContextNodeImpl,
  ExternalCallNodeImpl: () => ExternalCallNodeImpl,
  ExtractJsonNodeImpl: () => ExtractJsonNodeImpl,
  ExtractObjectPathNodeImpl: () => ExtractObjectPathNodeImpl,
  ExtractRegexNodeImpl: () => ExtractRegexNodeImpl,
  ExtractYamlNodeImpl: () => ExtractYamlNodeImpl,
  GetGlobalNodeImpl: () => GetGlobalNodeImpl,
  GraphInputNodeImpl: () => GraphInputNodeImpl,
  GraphOutputNodeImpl: () => GraphOutputNodeImpl,
  GraphProcessor: () => GraphProcessor,
  IfElseNodeImpl: () => IfElseNodeImpl,
  IfNodeImpl: () => IfNodeImpl,
  LoopControllerNodeImpl: () => LoopControllerNodeImpl,
  MatchNodeImpl: () => MatchNodeImpl,
  NodeImpl: () => NodeImpl,
  NodeNativeApi: () => NodeNativeApi,
  PassthroughNodeImpl: () => PassthroughNodeImpl,
  PopNodeImpl: () => PopNodeImpl,
  PromptNodeImpl: () => PromptNodeImpl,
  RaiseEventNodeImpl: () => RaiseEventNodeImpl,
  ReadDirectoryNodeImpl: () => ReadDirectoryNodeImpl,
  ReadFileNodeImpl: () => ReadFileNodeImpl,
  SetGlobalNodeImpl: () => SetGlobalNodeImpl,
  SubGraphNodeImpl: () => SubGraphNodeImpl,
  TextNodeImpl: () => TextNodeImpl,
  ToYamlNodeImpl: () => ToYamlNodeImpl,
  ToolNodeImpl: () => ToolNodeImpl,
  TrimChatMessagesNodeImpl: () => TrimChatMessagesNodeImpl,
  UserInputNodeImpl: () => UserInputNodeImpl,
  WaitForEventNodeImpl: () => WaitForEventNodeImpl,
  addWarning: () => addWarning,
  arrayNode: () => arrayNode,
  arrayTypeToScalarType: () => arrayTypeToScalarType,
  arrayizeDataValue: () => arrayizeDataValue,
  assemblePromptNode: () => assemblePromptNode,
  assertBaseDir: () => assertBaseDir,
  baseDirs: () => baseDirs,
  chatNode: () => chatNode,
  chunkNode: () => chunkNode,
  coalesceNode: () => coalesceNode,
  codeNode: () => codeNode,
  coerceType: () => coerceType,
  coerceTypeOptional: () => coerceTypeOptional,
  contextNode: () => contextNode,
  createNodeInstance: () => createNodeInstance,
  createProcessor: () => createProcessor,
  createUnknownNodeInstance: () => createUnknownNodeInstance,
  dataTypeDisplayNames: () => dataTypeDisplayNames,
  dataTypes: () => dataTypes,
  deserializeGraph: () => deserializeGraph,
  deserializeProject: () => deserializeProject,
  emptyNodeGraph: () => emptyNodeGraph,
  expectType: () => expectType,
  expectTypeOptional: () => expectTypeOptional,
  externalCallNode: () => externalCallNode,
  extractJsonNode: () => extractJsonNode,
  extractObjectPathNode: () => extractObjectPathNode,
  extractRegexNode: () => extractRegexNode,
  extractYamlNode: () => extractYamlNode,
  functionTypeToScalarType: () => functionTypeToScalarType,
  getDefaultValue: () => getDefaultValue,
  getError: () => getError,
  getGlobalNode: () => getGlobalNode,
  getNodeDisplayName: () => getNodeDisplayName,
  getScalarTypeOf: () => getScalarTypeOf,
  getWarnings: () => getWarnings,
  graphInputNode: () => graphInputNode,
  graphOutputNode: () => graphOutputNode,
  ifElseNode: () => ifElseNode,
  ifNode: () => ifNode,
  inferType: () => inferType,
  isArrayDataType: () => isArrayDataType,
  isArrayDataValue: () => isArrayDataValue,
  isFunctionDataType: () => isFunctionDataType,
  isFunctionDataValue: () => isFunctionDataValue,
  isNotFunctionDataValue: () => isNotFunctionDataValue,
  isScalarDataType: () => isScalarDataType,
  isScalarDataValue: () => isScalarDataValue,
  loadProjectFromFile: () => loadProjectFromFile,
  loadProjectFromString: () => loadProjectFromString,
  loopControllerNode: () => loopControllerNode,
  matchNode: () => matchNode,
  nodeDefinition: () => nodeDefinition,
  nodeFactory: () => nodeFactory,
  passthroughNode: () => passthroughNode,
  popNode: () => popNode,
  promptNode: () => promptNode,
  raiseEventNode: () => raiseEventNode,
  readDirectoryNode: () => readDirectoryNode,
  readFileNode: () => readFileNode,
  runGraph: () => runGraph,
  runGraphInFile: () => runGraphInFile,
  scalarDefaults: () => scalarDefaults,
  scalarTypes: () => scalarTypes,
  serializeGraph: () => serializeGraph,
  serializeProject: () => serializeProject,
  setGlobalNode: () => setGlobalNode,
  startDebuggerServer: () => startDebuggerServer,
  subGraphNode: () => subGraphNode,
  textNode: () => textNode,
  toYamlNode: () => toYamlNode,
  toolNode: () => toolNode,
  trimChatMessagesNode: () => trimChatMessagesNode,
  unwrapDataValue: () => unwrapDataValue,
  userInputNode: () => userInputNode,
  waitForEventNode: () => waitForEventNode
});
module.exports = __toCommonJS(src_exports);

// src/native/NodeNativeApi.ts
var import_promises = require("node:fs/promises");
var NodeNativeApi = class {
  async readdir(path, baseDir) {
    const results = await (0, import_promises.readdir)(path);
    return results;
  }
  async readTextFile(path, baseDir) {
    const result = await (0, import_promises.readFile)(path, { encoding: "utf8" });
    return result;
  }
  async readBinaryFile(path, baseDir) {
    const result = await (0, import_promises.readFile)(path);
    return new Blob([result]);
  }
  async writeTextFile(path, data, baseDir) {
    await (0, import_promises.writeFile)(path, data, { encoding: "utf8" });
  }
};

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_freeGlobal.js
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
var freeGlobal_default = freeGlobal;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_root.js
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal_default || freeSelf || Function("return this")();
var root_default = root;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Symbol.js
var Symbol2 = root_default.Symbol;
var Symbol_default = Symbol2;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getRawTag.js
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var nativeObjectToString = objectProto.toString;
var symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  try {
    value[symToStringTag] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
var getRawTag_default = getRawTag;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_objectToString.js
var objectProto2 = Object.prototype;
var nativeObjectToString2 = objectProto2.toString;
function objectToString(value) {
  return nativeObjectToString2.call(value);
}
var objectToString_default = objectToString;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseGetTag.js
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
}
var baseGetTag_default = baseGetTag;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default = isObjectLike;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isSymbol.js
var symbolTag = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
}
var isSymbol_default = isSymbol;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_arrayMap.js
function arrayMap(array, iteratee) {
  var index = -1, length = array == null ? 0 : array.length, result = Array(length);
  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}
var arrayMap_default = arrayMap;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isArray.js
var isArray = Array.isArray;
var isArray_default = isArray;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseToString.js
var INFINITY = 1 / 0;
var symbolProto = Symbol_default ? Symbol_default.prototype : void 0;
var symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray_default(value)) {
    return arrayMap_default(value, baseToString) + "";
  }
  if (isSymbol_default(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
}
var baseToString_default = baseToString;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_trimmedEndIndex.js
var reWhitespace = /\s/;
function trimmedEndIndex(string) {
  var index = string.length;
  while (index-- && reWhitespace.test(string.charAt(index))) {
  }
  return index;
}
var trimmedEndIndex_default = trimmedEndIndex;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseTrim.js
var reTrimStart = /^\s+/;
function baseTrim(string) {
  return string ? string.slice(0, trimmedEndIndex_default(string) + 1).replace(reTrimStart, "") : string;
}
var baseTrim_default = baseTrim;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isObject.js
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_default = isObject;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/toNumber.js
var NAN = 0 / 0;
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
var reIsBinary = /^0b[01]+$/i;
var reIsOctal = /^0o[0-7]+$/i;
var freeParseInt = parseInt;
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol_default(value)) {
    return NAN;
  }
  if (isObject_default(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject_default(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = baseTrim_default(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
var toNumber_default = toNumber;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/toFinite.js
var INFINITY2 = 1 / 0;
var MAX_INTEGER = 17976931348623157e292;
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber_default(value);
  if (value === INFINITY2 || value === -INFINITY2) {
    var sign = value < 0 ? -1 : 1;
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}
var toFinite_default = toFinite;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/identity.js
function identity(value) {
  return value;
}
var identity_default = identity;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isFunction.js
var asyncTag = "[object AsyncFunction]";
var funcTag = "[object Function]";
var genTag = "[object GeneratorFunction]";
var proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject_default(value)) {
    return false;
  }
  var tag = baseGetTag_default(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}
var isFunction_default = isFunction;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_coreJsData.js
var coreJsData = root_default["__core-js_shared__"];
var coreJsData_default = coreJsData;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isMasked.js
var maskSrcKey = function() {
  var uid = /[^.]+$/.exec(coreJsData_default && coreJsData_default.keys && coreJsData_default.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var isMasked_default = isMasked;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_toSource.js
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var toSource_default = toSource;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIsNative.js
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto2 = Function.prototype;
var objectProto3 = Object.prototype;
var funcToString2 = funcProto2.toString;
var hasOwnProperty2 = objectProto3.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString2.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative(value) {
  if (!isObject_default(value) || isMasked_default(value)) {
    return false;
  }
  var pattern = isFunction_default(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource_default(value));
}
var baseIsNative_default = baseIsNative;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getValue.js
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
var getValue_default = getValue;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getNative.js
function getNative(object, key) {
  var value = getValue_default(object, key);
  return baseIsNative_default(value) ? value : void 0;
}
var getNative_default = getNative;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_WeakMap.js
var WeakMap2 = getNative_default(root_default, "WeakMap");
var WeakMap_default = WeakMap2;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_apply.js
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
var apply_default = apply;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_shortOut.js
var HOT_COUNT = 800;
var HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
var shortOut_default = shortOut;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/constant.js
function constant(value) {
  return function() {
    return value;
  };
}
var constant_default = constant;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_defineProperty.js
var defineProperty = function() {
  try {
    var func = getNative_default(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
}();
var defineProperty_default = defineProperty;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseSetToString.js
var baseSetToString = !defineProperty_default ? identity_default : function(func, string) {
  return defineProperty_default(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant_default(string),
    "writable": true
  });
};
var baseSetToString_default = baseSetToString;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_setToString.js
var setToString = shortOut_default(baseSetToString_default);
var setToString_default = setToString;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isIndex.js
var MAX_SAFE_INTEGER = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
var isIndex_default = isIndex;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseAssignValue.js
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty_default) {
    defineProperty_default(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
var baseAssignValue_default = baseAssignValue;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/eq.js
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
var eq_default = eq;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_overRest.js
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply_default(func, this, otherArgs);
  };
}
var overRest_default = overRest;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseRest.js
function baseRest(func, start) {
  return setToString_default(overRest_default(func, start, identity_default), func + "");
}
var baseRest_default = baseRest;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isLength.js
var MAX_SAFE_INTEGER2 = 9007199254740991;
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
}
var isLength_default = isLength;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isArrayLike.js
function isArrayLike(value) {
  return value != null && isLength_default(value.length) && !isFunction_default(value);
}
var isArrayLike_default = isArrayLike;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isIterateeCall.js
function isIterateeCall(value, index, object) {
  if (!isObject_default(object)) {
    return false;
  }
  var type = typeof index;
  if (type == "number" ? isArrayLike_default(object) && isIndex_default(index, object.length) : type == "string" && index in object) {
    return eq_default(object[index], value);
  }
  return false;
}
var isIterateeCall_default = isIterateeCall;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isPrototype.js
var objectProto4 = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto4;
  return value === proto;
}
var isPrototype_default = isPrototype;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseTimes.js
function baseTimes(n, iteratee) {
  var index = -1, result = Array(n);
  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}
var baseTimes_default = baseTimes;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIsArguments.js
var argsTag = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike_default(value) && baseGetTag_default(value) == argsTag;
}
var baseIsArguments_default = baseIsArguments;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isArguments.js
var objectProto5 = Object.prototype;
var hasOwnProperty3 = objectProto5.hasOwnProperty;
var propertyIsEnumerable = objectProto5.propertyIsEnumerable;
var isArguments = baseIsArguments_default(function() {
  return arguments;
}()) ? baseIsArguments_default : function(value) {
  return isObjectLike_default(value) && hasOwnProperty3.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
};
var isArguments_default = isArguments;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/stubFalse.js
function stubFalse() {
  return false;
}
var stubFalse_default = stubFalse;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isBuffer.js
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer2 = moduleExports ? root_default.Buffer : void 0;
var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse_default;
var isBuffer_default = isBuffer;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIsTypedArray.js
var argsTag2 = "[object Arguments]";
var arrayTag = "[object Array]";
var boolTag = "[object Boolean]";
var dateTag = "[object Date]";
var errorTag = "[object Error]";
var funcTag2 = "[object Function]";
var mapTag = "[object Map]";
var numberTag = "[object Number]";
var objectTag = "[object Object]";
var regexpTag = "[object RegExp]";
var setTag = "[object Set]";
var stringTag = "[object String]";
var weakMapTag = "[object WeakMap]";
var arrayBufferTag = "[object ArrayBuffer]";
var dataViewTag = "[object DataView]";
var float32Tag = "[object Float32Array]";
var float64Tag = "[object Float64Array]";
var int8Tag = "[object Int8Array]";
var int16Tag = "[object Int16Array]";
var int32Tag = "[object Int32Array]";
var uint8Tag = "[object Uint8Array]";
var uint8ClampedTag = "[object Uint8ClampedArray]";
var uint16Tag = "[object Uint16Array]";
var uint32Tag = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag2] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag2] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
function baseIsTypedArray(value) {
  return isObjectLike_default(value) && isLength_default(value.length) && !!typedArrayTags[baseGetTag_default(value)];
}
var baseIsTypedArray_default = baseIsTypedArray;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseUnary.js
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}
var baseUnary_default = baseUnary;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_nodeUtil.js
var freeExports2 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule2 = freeExports2 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports2 = freeModule2 && freeModule2.exports === freeExports2;
var freeProcess = moduleExports2 && freeGlobal_default.process;
var nodeUtil = function() {
  try {
    var types = freeModule2 && freeModule2.require && freeModule2.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e) {
  }
}();
var nodeUtil_default = nodeUtil;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isTypedArray.js
var nodeIsTypedArray = nodeUtil_default && nodeUtil_default.isTypedArray;
var isTypedArray = nodeIsTypedArray ? baseUnary_default(nodeIsTypedArray) : baseIsTypedArray_default;
var isTypedArray_default = isTypedArray;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_arrayLikeKeys.js
var objectProto6 = Object.prototype;
var hasOwnProperty4 = objectProto6.hasOwnProperty;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_default(value), isArg = !isArr && isArguments_default(value), isBuff = !isArr && !isArg && isBuffer_default(value), isType = !isArr && !isArg && !isBuff && isTypedArray_default(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes_default(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty4.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex_default(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
var arrayLikeKeys_default = arrayLikeKeys;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_overArg.js
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var overArg_default = overArg;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_nativeKeys.js
var nativeKeys = overArg_default(Object.keys, Object);
var nativeKeys_default = nativeKeys;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseKeys.js
var objectProto7 = Object.prototype;
var hasOwnProperty5 = objectProto7.hasOwnProperty;
function baseKeys(object) {
  if (!isPrototype_default(object)) {
    return nativeKeys_default(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty5.call(object, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
var baseKeys_default = baseKeys;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/keys.js
function keys(object) {
  return isArrayLike_default(object) ? arrayLikeKeys_default(object) : baseKeys_default(object);
}
var keys_default = keys;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isKey.js
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
var reIsPlainProp = /^\w*$/;
function isKey(value, object) {
  if (isArray_default(value)) {
    return false;
  }
  var type = typeof value;
  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol_default(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}
var isKey_default = isKey;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_nativeCreate.js
var nativeCreate = getNative_default(Object, "create");
var nativeCreate_default = nativeCreate;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_hashClear.js
function hashClear() {
  this.__data__ = nativeCreate_default ? nativeCreate_default(null) : {};
  this.size = 0;
}
var hashClear_default = hashClear;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_hashDelete.js
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var hashDelete_default = hashDelete;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_hashGet.js
var HASH_UNDEFINED = "__lodash_hash_undefined__";
var objectProto8 = Object.prototype;
var hasOwnProperty6 = objectProto8.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate_default) {
    var result = data[key];
    return result === HASH_UNDEFINED ? void 0 : result;
  }
  return hasOwnProperty6.call(data, key) ? data[key] : void 0;
}
var hashGet_default = hashGet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_hashHas.js
var objectProto9 = Object.prototype;
var hasOwnProperty7 = objectProto9.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate_default ? data[key] !== void 0 : hasOwnProperty7.call(data, key);
}
var hashHas_default = hashHas;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_hashSet.js
var HASH_UNDEFINED2 = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate_default && value === void 0 ? HASH_UNDEFINED2 : value;
  return this;
}
var hashSet_default = hashSet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Hash.js
function Hash(entries2) {
  var index = -1, length = entries2 == null ? 0 : entries2.length;
  this.clear();
  while (++index < length) {
    var entry = entries2[index];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear_default;
Hash.prototype["delete"] = hashDelete_default;
Hash.prototype.get = hashGet_default;
Hash.prototype.has = hashHas_default;
Hash.prototype.set = hashSet_default;
var Hash_default = Hash;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_listCacheClear.js
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
var listCacheClear_default = listCacheClear;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_assocIndexOf.js
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_default(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var assocIndexOf_default = assocIndexOf;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_listCacheDelete.js
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}
var listCacheDelete_default = listCacheDelete;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_listCacheGet.js
function listCacheGet(key) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  return index < 0 ? void 0 : data[index][1];
}
var listCacheGet_default = listCacheGet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_listCacheHas.js
function listCacheHas(key) {
  return assocIndexOf_default(this.__data__, key) > -1;
}
var listCacheHas_default = listCacheHas;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_listCacheSet.js
function listCacheSet(key, value) {
  var data = this.__data__, index = assocIndexOf_default(data, key);
  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}
var listCacheSet_default = listCacheSet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_ListCache.js
function ListCache(entries2) {
  var index = -1, length = entries2 == null ? 0 : entries2.length;
  this.clear();
  while (++index < length) {
    var entry = entries2[index];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear_default;
ListCache.prototype["delete"] = listCacheDelete_default;
ListCache.prototype.get = listCacheGet_default;
ListCache.prototype.has = listCacheHas_default;
ListCache.prototype.set = listCacheSet_default;
var ListCache_default = ListCache;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Map.js
var Map2 = getNative_default(root_default, "Map");
var Map_default = Map2;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_mapCacheClear.js
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash_default(),
    "map": new (Map_default || ListCache_default)(),
    "string": new Hash_default()
  };
}
var mapCacheClear_default = mapCacheClear;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isKeyable.js
function isKeyable(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
var isKeyable_default = isKeyable;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getMapData.js
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable_default(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
var getMapData_default = getMapData;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_mapCacheDelete.js
function mapCacheDelete(key) {
  var result = getMapData_default(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
var mapCacheDelete_default = mapCacheDelete;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_mapCacheGet.js
function mapCacheGet(key) {
  return getMapData_default(this, key).get(key);
}
var mapCacheGet_default = mapCacheGet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_mapCacheHas.js
function mapCacheHas(key) {
  return getMapData_default(this, key).has(key);
}
var mapCacheHas_default = mapCacheHas;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_mapCacheSet.js
function mapCacheSet(key, value) {
  var data = getMapData_default(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
var mapCacheSet_default = mapCacheSet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_MapCache.js
function MapCache(entries2) {
  var index = -1, length = entries2 == null ? 0 : entries2.length;
  this.clear();
  while (++index < length) {
    var entry = entries2[index];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear_default;
MapCache.prototype["delete"] = mapCacheDelete_default;
MapCache.prototype.get = mapCacheGet_default;
MapCache.prototype.has = mapCacheHas_default;
MapCache.prototype.set = mapCacheSet_default;
var MapCache_default = MapCache;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/memoize.js
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache2 = memoized.cache;
    if (cache2.has(key)) {
      return cache2.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache2.set(key, result) || cache2;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache_default)();
  return memoized;
}
memoize.Cache = MapCache_default;
var memoize_default = memoize;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_memoizeCapped.js
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped(func) {
  var result = memoize_default(func, function(key) {
    if (cache2.size === MAX_MEMOIZE_SIZE) {
      cache2.clear();
    }
    return key;
  });
  var cache2 = result.cache;
  return result;
}
var memoizeCapped_default = memoizeCapped;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_stringToPath.js
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath = memoizeCapped_default(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46) {
    result.push("");
  }
  string.replace(rePropName, function(match4, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match4);
  });
  return result;
});
var stringToPath_default = stringToPath;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/toString.js
function toString(value) {
  return value == null ? "" : baseToString_default(value);
}
var toString_default = toString;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_castPath.js
function castPath(value, object) {
  if (isArray_default(value)) {
    return value;
  }
  return isKey_default(value, object) ? [value] : stringToPath_default(toString_default(value));
}
var castPath_default = castPath;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_toKey.js
var INFINITY3 = 1 / 0;
function toKey(value) {
  if (typeof value == "string" || isSymbol_default(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY3 ? "-0" : result;
}
var toKey_default = toKey;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseGet.js
function baseGet(object, path) {
  path = castPath_default(path, object);
  var index = 0, length = path.length;
  while (object != null && index < length) {
    object = object[toKey_default(path[index++])];
  }
  return index && index == length ? object : void 0;
}
var baseGet_default = baseGet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/get.js
function get(object, path, defaultValue) {
  var result = object == null ? void 0 : baseGet_default(object, path);
  return result === void 0 ? defaultValue : result;
}
var get_default = get;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_arrayPush.js
function arrayPush(array, values2) {
  var index = -1, length = values2.length, offset = array.length;
  while (++index < length) {
    array[offset + index] = values2[index];
  }
  return array;
}
var arrayPush_default = arrayPush;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_stackClear.js
function stackClear() {
  this.__data__ = new ListCache_default();
  this.size = 0;
}
var stackClear_default = stackClear;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_stackDelete.js
function stackDelete(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
var stackDelete_default = stackDelete;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_stackGet.js
function stackGet(key) {
  return this.__data__.get(key);
}
var stackGet_default = stackGet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_stackHas.js
function stackHas(key) {
  return this.__data__.has(key);
}
var stackHas_default = stackHas;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_stackSet.js
var LARGE_ARRAY_SIZE = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache_default) {
    var pairs = data.__data__;
    if (!Map_default || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache_default(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
var stackSet_default = stackSet;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Stack.js
function Stack(entries2) {
  var data = this.__data__ = new ListCache_default(entries2);
  this.size = data.size;
}
Stack.prototype.clear = stackClear_default;
Stack.prototype["delete"] = stackDelete_default;
Stack.prototype.get = stackGet_default;
Stack.prototype.has = stackHas_default;
Stack.prototype.set = stackSet_default;
var Stack_default = Stack;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_arrayFilter.js
function arrayFilter(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
var arrayFilter_default = arrayFilter;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/stubArray.js
function stubArray() {
  return [];
}
var stubArray_default = stubArray;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getSymbols.js
var objectProto10 = Object.prototype;
var propertyIsEnumerable2 = objectProto10.propertyIsEnumerable;
var nativeGetSymbols = Object.getOwnPropertySymbols;
var getSymbols = !nativeGetSymbols ? stubArray_default : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter_default(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable2.call(object, symbol);
  });
};
var getSymbols_default = getSymbols;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseGetAllKeys.js
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_default(object) ? result : arrayPush_default(result, symbolsFunc(object));
}
var baseGetAllKeys_default = baseGetAllKeys;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getAllKeys.js
function getAllKeys(object) {
  return baseGetAllKeys_default(object, keys_default, getSymbols_default);
}
var getAllKeys_default = getAllKeys;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_DataView.js
var DataView = getNative_default(root_default, "DataView");
var DataView_default = DataView;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Promise.js
var Promise2 = getNative_default(root_default, "Promise");
var Promise_default = Promise2;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Set.js
var Set2 = getNative_default(root_default, "Set");
var Set_default = Set2;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getTag.js
var mapTag2 = "[object Map]";
var objectTag2 = "[object Object]";
var promiseTag = "[object Promise]";
var setTag2 = "[object Set]";
var weakMapTag2 = "[object WeakMap]";
var dataViewTag2 = "[object DataView]";
var dataViewCtorString = toSource_default(DataView_default);
var mapCtorString = toSource_default(Map_default);
var promiseCtorString = toSource_default(Promise_default);
var setCtorString = toSource_default(Set_default);
var weakMapCtorString = toSource_default(WeakMap_default);
var getTag = baseGetTag_default;
if (DataView_default && getTag(new DataView_default(new ArrayBuffer(1))) != dataViewTag2 || Map_default && getTag(new Map_default()) != mapTag2 || Promise_default && getTag(Promise_default.resolve()) != promiseTag || Set_default && getTag(new Set_default()) != setTag2 || WeakMap_default && getTag(new WeakMap_default()) != weakMapTag2) {
  getTag = function(value) {
    var result = baseGetTag_default(value), Ctor = result == objectTag2 ? value.constructor : void 0, ctorString = Ctor ? toSource_default(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag2;
        case mapCtorString:
          return mapTag2;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag2;
        case weakMapCtorString:
          return weakMapTag2;
      }
    }
    return result;
  };
}
var getTag_default = getTag;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_Uint8Array.js
var Uint8Array2 = root_default.Uint8Array;
var Uint8Array_default = Uint8Array2;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_setCacheAdd.js
var HASH_UNDEFINED3 = "__lodash_hash_undefined__";
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED3);
  return this;
}
var setCacheAdd_default = setCacheAdd;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_setCacheHas.js
function setCacheHas(value) {
  return this.__data__.has(value);
}
var setCacheHas_default = setCacheHas;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_SetCache.js
function SetCache(values2) {
  var index = -1, length = values2 == null ? 0 : values2.length;
  this.__data__ = new MapCache_default();
  while (++index < length) {
    this.add(values2[index]);
  }
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd_default;
SetCache.prototype.has = setCacheHas_default;
var SetCache_default = SetCache;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_arraySome.js
function arraySome(array, predicate) {
  var index = -1, length = array == null ? 0 : array.length;
  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}
var arraySome_default = arraySome;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_cacheHas.js
function cacheHas(cache2, key) {
  return cache2.has(key);
}
var cacheHas_default = cacheHas;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_equalArrays.js
var COMPARE_PARTIAL_FLAG = 1;
var COMPARE_UNORDERED_FLAG = 2;
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }
  var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache_default() : void 0;
  stack.set(array, other);
  stack.set(other, array);
  while (++index < arrLength) {
    var arrValue = array[index], othValue = other[index];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== void 0) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    if (seen) {
      if (!arraySome_default(other, function(othValue2, othIndex) {
        if (!cacheHas_default(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack["delete"](array);
  stack["delete"](other);
  return result;
}
var equalArrays_default = equalArrays;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_mapToArray.js
function mapToArray(map) {
  var index = -1, result = Array(map.size);
  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}
var mapToArray_default = mapToArray;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_setToArray.js
function setToArray(set) {
  var index = -1, result = Array(set.size);
  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}
var setToArray_default = setToArray;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_equalByTag.js
var COMPARE_PARTIAL_FLAG2 = 1;
var COMPARE_UNORDERED_FLAG2 = 2;
var boolTag2 = "[object Boolean]";
var dateTag2 = "[object Date]";
var errorTag2 = "[object Error]";
var mapTag3 = "[object Map]";
var numberTag2 = "[object Number]";
var regexpTag2 = "[object RegExp]";
var setTag3 = "[object Set]";
var stringTag2 = "[object String]";
var symbolTag2 = "[object Symbol]";
var arrayBufferTag2 = "[object ArrayBuffer]";
var dataViewTag3 = "[object DataView]";
var symbolProto2 = Symbol_default ? Symbol_default.prototype : void 0;
var symbolValueOf = symbolProto2 ? symbolProto2.valueOf : void 0;
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag3:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;
    case arrayBufferTag2:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array_default(object), new Uint8Array_default(other))) {
        return false;
      }
      return true;
    case boolTag2:
    case dateTag2:
    case numberTag2:
      return eq_default(+object, +other);
    case errorTag2:
      return object.name == other.name && object.message == other.message;
    case regexpTag2:
    case stringTag2:
      return object == other + "";
    case mapTag3:
      var convert = mapToArray_default;
    case setTag3:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG2;
      convert || (convert = setToArray_default);
      if (object.size != other.size && !isPartial) {
        return false;
      }
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG2;
      stack.set(object, other);
      var result = equalArrays_default(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack["delete"](object);
      return result;
    case symbolTag2:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}
var equalByTag_default = equalByTag;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_equalObjects.js
var COMPARE_PARTIAL_FLAG3 = 1;
var objectProto11 = Object.prototype;
var hasOwnProperty8 = objectProto11.hasOwnProperty;
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG3, objProps = getAllKeys_default(object), objLength = objProps.length, othProps = getAllKeys_default(other), othLength = othProps.length;
  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty8.call(other, key))) {
      return false;
    }
  }
  var objStacked = stack.get(object);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key], othValue = other[key];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    }
    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == "constructor");
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor, othCtor = other.constructor;
    if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack["delete"](object);
  stack["delete"](other);
  return result;
}
var equalObjects_default = equalObjects;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIsEqualDeep.js
var COMPARE_PARTIAL_FLAG4 = 1;
var argsTag3 = "[object Arguments]";
var arrayTag2 = "[object Array]";
var objectTag3 = "[object Object]";
var objectProto12 = Object.prototype;
var hasOwnProperty9 = objectProto12.hasOwnProperty;
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_default(object), othIsArr = isArray_default(other), objTag = objIsArr ? arrayTag2 : getTag_default(object), othTag = othIsArr ? arrayTag2 : getTag_default(other);
  objTag = objTag == argsTag3 ? objectTag3 : objTag;
  othTag = othTag == argsTag3 ? objectTag3 : othTag;
  var objIsObj = objTag == objectTag3, othIsObj = othTag == objectTag3, isSameTag = objTag == othTag;
  if (isSameTag && isBuffer_default(object)) {
    if (!isBuffer_default(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack_default());
    return objIsArr || isTypedArray_default(object) ? equalArrays_default(object, other, bitmask, customizer, equalFunc, stack) : equalByTag_default(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG4)) {
    var objIsWrapped = objIsObj && hasOwnProperty9.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty9.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack_default());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack_default());
  return equalObjects_default(object, other, bitmask, customizer, equalFunc, stack);
}
var baseIsEqualDeep_default = baseIsEqualDeep;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIsEqual.js
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike_default(value) && !isObjectLike_default(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep_default(value, other, bitmask, customizer, baseIsEqual, stack);
}
var baseIsEqual_default = baseIsEqual;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIsMatch.js
var COMPARE_PARTIAL_FLAG5 = 1;
var COMPARE_UNORDERED_FLAG3 = 2;
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length, length = index, noCustomizer = !customizer;
  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0], objValue = object[key], srcValue = data[1];
    if (noCustomizer && data[2]) {
      if (objValue === void 0 && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack_default();
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === void 0 ? baseIsEqual_default(srcValue, objValue, COMPARE_PARTIAL_FLAG5 | COMPARE_UNORDERED_FLAG3, customizer, stack) : result)) {
        return false;
      }
    }
  }
  return true;
}
var baseIsMatch_default = baseIsMatch;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_isStrictComparable.js
function isStrictComparable(value) {
  return value === value && !isObject_default(value);
}
var isStrictComparable_default = isStrictComparable;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_getMatchData.js
function getMatchData(object) {
  var result = keys_default(object), length = result.length;
  while (length--) {
    var key = result[length], value = object[key];
    result[length] = [key, value, isStrictComparable_default(value)];
  }
  return result;
}
var getMatchData_default = getMatchData;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_matchesStrictComparable.js
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
  };
}
var matchesStrictComparable_default = matchesStrictComparable;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseMatches.js
function baseMatches(source) {
  var matchData = getMatchData_default(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable_default(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch_default(object, source, matchData);
  };
}
var baseMatches_default = baseMatches;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseHasIn.js
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}
var baseHasIn_default = baseHasIn;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_hasPath.js
function hasPath(object, path, hasFunc) {
  path = castPath_default(path, object);
  var index = -1, length = path.length, result = false;
  while (++index < length) {
    var key = toKey_default(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength_default(length) && isIndex_default(key, length) && (isArray_default(object) || isArguments_default(object));
}
var hasPath_default = hasPath;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/hasIn.js
function hasIn(object, path) {
  return object != null && hasPath_default(object, path, baseHasIn_default);
}
var hasIn_default = hasIn;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseMatchesProperty.js
var COMPARE_PARTIAL_FLAG6 = 1;
var COMPARE_UNORDERED_FLAG4 = 2;
function baseMatchesProperty(path, srcValue) {
  if (isKey_default(path) && isStrictComparable_default(srcValue)) {
    return matchesStrictComparable_default(toKey_default(path), srcValue);
  }
  return function(object) {
    var objValue = get_default(object, path);
    return objValue === void 0 && objValue === srcValue ? hasIn_default(object, path) : baseIsEqual_default(srcValue, objValue, COMPARE_PARTIAL_FLAG6 | COMPARE_UNORDERED_FLAG4);
  };
}
var baseMatchesProperty_default = baseMatchesProperty;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseProperty.js
function baseProperty(key) {
  return function(object) {
    return object == null ? void 0 : object[key];
  };
}
var baseProperty_default = baseProperty;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_basePropertyDeep.js
function basePropertyDeep(path) {
  return function(object) {
    return baseGet_default(object, path);
  };
}
var basePropertyDeep_default = basePropertyDeep;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/property.js
function property(path) {
  return isKey_default(path) ? baseProperty_default(toKey_default(path)) : basePropertyDeep_default(path);
}
var property_default = property;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseIteratee.js
function baseIteratee(value) {
  if (typeof value == "function") {
    return value;
  }
  if (value == null) {
    return identity_default;
  }
  if (typeof value == "object") {
    return isArray_default(value) ? baseMatchesProperty_default(value[0], value[1]) : baseMatches_default(value);
  }
  return property_default(value);
}
var baseIteratee_default = baseIteratee;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_createBaseFor.js
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}
var createBaseFor_default = createBaseFor;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseFor.js
var baseFor = createBaseFor_default();
var baseFor_default = baseFor;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseForOwn.js
function baseForOwn(object, iteratee) {
  return object && baseFor_default(object, iteratee, keys_default);
}
var baseForOwn_default = baseForOwn;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_createBaseEach.js
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike_default(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length, index = fromRight ? length : -1, iterable = Object(collection);
    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}
var createBaseEach_default = createBaseEach;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseEach.js
var baseEach = createBaseEach_default(baseForOwn_default);
var baseEach_default = baseEach;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/isArrayLikeObject.js
function isArrayLikeObject(value) {
  return isObjectLike_default(value) && isArrayLike_default(value);
}
var isArrayLikeObject_default = isArrayLikeObject;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseMap.js
function baseMap(collection, iteratee) {
  var index = -1, result = isArrayLike_default(collection) ? Array(collection.length) : [];
  baseEach_default(collection, function(value, key, collection2) {
    result[++index] = iteratee(value, key, collection2);
  });
  return result;
}
var baseMap_default = baseMap;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseGt.js
function baseGt(value, other) {
  return value > other;
}
var baseGt_default = baseGt;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/mapValues.js
function mapValues(object, iteratee) {
  var result = {};
  iteratee = baseIteratee_default(iteratee, 3);
  baseForOwn_default(object, function(value, key, object2) {
    baseAssignValue_default(result, key, iteratee(value, key, object2));
  });
  return result;
}
var mapValues_default = mapValues;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseExtremum.js
function baseExtremum(array, iteratee, comparator) {
  var index = -1, length = array.length;
  while (++index < length) {
    var value = array[index], current = iteratee(value);
    if (current != null && (computed === void 0 ? current === current && !isSymbol_default(current) : comparator(current, computed))) {
      var computed = current, result = value;
    }
  }
  return result;
}
var baseExtremum_default = baseExtremum;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/max.js
function max(array) {
  return array && array.length ? baseExtremum_default(array, identity_default, baseGt_default) : void 0;
}
var max_default = max;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseSortBy.js
function baseSortBy(array, comparer) {
  var length = array.length;
  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}
var baseSortBy_default = baseSortBy;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_compareAscending.js
function compareAscending(value, other) {
  if (value !== other) {
    var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol_default(value);
    var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol_default(other);
    if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
      return 1;
    }
    if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
      return -1;
    }
  }
  return 0;
}
var compareAscending_default = compareAscending;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_compareMultiple.js
function compareMultiple(object, other, orders) {
  var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
  while (++index < length) {
    var result = compareAscending_default(objCriteria[index], othCriteria[index]);
    if (result) {
      if (index >= ordersLength) {
        return result;
      }
      var order = orders[index];
      return result * (order == "desc" ? -1 : 1);
    }
  }
  return object.index - other.index;
}
var compareMultiple_default = compareMultiple;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseOrderBy.js
function baseOrderBy(collection, iteratees, orders) {
  if (iteratees.length) {
    iteratees = arrayMap_default(iteratees, function(iteratee) {
      if (isArray_default(iteratee)) {
        return function(value) {
          return baseGet_default(value, iteratee.length === 1 ? iteratee[0] : iteratee);
        };
      }
      return iteratee;
    });
  } else {
    iteratees = [identity_default];
  }
  var index = -1;
  iteratees = arrayMap_default(iteratees, baseUnary_default(baseIteratee_default));
  var result = baseMap_default(collection, function(value, key, collection2) {
    var criteria = arrayMap_default(iteratees, function(iteratee) {
      return iteratee(value);
    });
    return { "criteria": criteria, "index": ++index, "value": value };
  });
  return baseSortBy_default(result, function(object, other) {
    return compareMultiple_default(object, other, orders);
  });
}
var baseOrderBy_default = baseOrderBy;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/orderBy.js
function orderBy(collection, iteratees, orders, guard) {
  if (collection == null) {
    return [];
  }
  if (!isArray_default(iteratees)) {
    iteratees = iteratees == null ? [] : [iteratees];
  }
  orders = guard ? void 0 : orders;
  if (!isArray_default(orders)) {
    orders = orders == null ? [] : [orders];
  }
  return baseOrderBy_default(collection, iteratees, orders);
}
var orderBy_default = orderBy;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_baseRange.js
var nativeCeil = Math.ceil;
var nativeMax2 = Math.max;
function baseRange(start, end, step, fromRight) {
  var index = -1, length = nativeMax2(nativeCeil((end - start) / (step || 1)), 0), result = Array(length);
  while (length--) {
    result[fromRight ? length : ++index] = start;
    start += step;
  }
  return result;
}
var baseRange_default = baseRange;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/_createRange.js
function createRange(fromRight) {
  return function(start, end, step) {
    if (step && typeof step != "number" && isIterateeCall_default(start, end, step)) {
      end = step = void 0;
    }
    start = toFinite_default(start);
    if (end === void 0) {
      end = start;
      start = 0;
    } else {
      end = toFinite_default(end);
    }
    step = step === void 0 ? start < end ? 1 : -1 : toFinite_default(step);
    return baseRange_default(start, end, step, fromRight);
  };
}
var createRange_default = createRange;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/range.js
var range = createRange_default();
var range_default = range;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/unzip.js
var nativeMax3 = Math.max;
function unzip(array) {
  if (!(array && array.length)) {
    return [];
  }
  var length = 0;
  array = arrayFilter_default(array, function(group) {
    if (isArrayLikeObject_default(group)) {
      length = nativeMax3(group.length, length);
      return true;
    }
  });
  return baseTimes_default(length, function(index) {
    return arrayMap_default(array, baseProperty_default(index));
  });
}
var unzip_default = unzip;

// ../../.yarn/cache/lodash-es-npm-4.17.21-b45832dfce-05cbffad6e.zip/node_modules/lodash-es/zip.js
var zip = baseRest_default(unzip_default);
var zip_default = zip;

// ../core/dist/utils/symbols.js
var ControlFlowExcluded = "__internalPort_ControlFlowExcluded";
var ControlFlowExcludedPort = ControlFlowExcluded;
var Warnings = "__internalPort_Warnings";
var WarningsPort = Warnings;

// ../core/dist/utils/genericUtilFunctions.js
function isNotNull(value) {
  return value != null;
}
var exhaustiveTuple = () => (
  // impressive inference from TS: it knows when the condition and the true branch can't both be satisfied
  (...x) => x
);

// ../core/dist/model/DataValue.js
var dataTypes = exhaustiveTuple()("any", "any[]", "boolean", "boolean[]", "string", "string[]", "number", "number[]", "date", "date[]", "time", "time[]", "datetime", "datetime[]", "chat-message", "chat-message[]", "control-flow-excluded", "control-flow-excluded[]", "object", "object[]", "fn<string>", "fn<number>", "fn<boolean>", "fn<date>", "fn<time>", "fn<datetime>", "fn<any>", "fn<object>", "fn<chat-message>", "fn<control-flow-excluded>", "fn<string[]>", "fn<number[]>", "fn<boolean[]>", "fn<date[]>", "fn<time[]>", "fn<datetime[]>", "fn<any[]>", "fn<object[]>", "fn<chat-message[]>", "fn<control-flow-excluded[]>", "gpt-tool", "gpt-tool[]", "fn<gpt-tool[]>", "fn<gpt-tool>");
var scalarTypes = exhaustiveTuple()("any", "boolean", "string", "number", "date", "time", "datetime", "chat-message", "control-flow-excluded", "object", "gpt-tool");
var dataTypeDisplayNames = {
  any: "Any",
  "any[]": "Any Array",
  boolean: "Boolean",
  "boolean[]": "Boolean Array",
  string: "String",
  "string[]": "String Array",
  number: "Number",
  "number[]": "Number Array",
  date: "Date",
  "date[]": "Date Array",
  time: "Time",
  "time[]": "Time Array",
  datetime: "DateTime",
  "datetime[]": "DateTime Array",
  "chat-message": "ChatMessage",
  "chat-message[]": "ChatMessage Array",
  "control-flow-excluded": "ControlFlowExcluded",
  "control-flow-excluded[]": "ControlFlowExcluded Array",
  object: "Object",
  "object[]": "Object Array",
  "gpt-tool": "GPT Tool",
  "gpt-tool[]": "GPT Tool Array",
  "fn<string>": "Function<String>",
  "fn<number>": "Function<Number>",
  "fn<boolean>": "Function<Boolean>",
  "fn<date>": "Function<Date>",
  "fn<time>": "Function<Time>",
  "fn<datetime>": "Function<DateTime>",
  "fn<any>": "Function<Any>",
  "fn<object>": "Function<Object>",
  "fn<chat-message>": "Function<ChatMessage>",
  "fn<control-flow-excluded>": "Function<ControlFlowExcluded>",
  "fn<gpt-tool>": "Function<GPT Tool>",
  "fn<string[]>": "Function<String Array>",
  "fn<number[]>": "Function<Number Array>",
  "fn<boolean[]>": "Function<Boolean Array>",
  "fn<date[]>": "Function<Date Array>",
  "fn<time[]>": "Function<Time Array>",
  "fn<datetime[]>": "Function<DateTime Array>",
  "fn<any[]>": "Function<Any Array>",
  "fn<object[]>": "Function<Object Array>",
  "fn<chat-message[]>": "Function<ChatMessage Array>",
  "fn<control-flow-excluded[]>": "Function<ControlFlowExcluded Array>",
  "fn<gpt-tool[]>": "Function<GPT Tool Array>"
};
function isScalarDataValue(value) {
  if (!value) {
    return false;
  }
  return !isArrayDataType(value.type) && !isFunctionDataType(value.type);
}
function isScalarDataType(type) {
  return !isArrayDataType(type) && !isFunctionDataType(type);
}
function isArrayDataValue(value) {
  if (!value) {
    return false;
  }
  return isArrayDataType(value.type) || (value.type === "any" || value.type === "object") && Array.isArray(value.value);
}
function isArrayDataType(type) {
  return type.endsWith("[]");
}
function isFunctionDataType(type) {
  return type.startsWith("fn<");
}
function isFunctionDataValue(value) {
  if (!value) {
    return false;
  }
  return isFunctionDataType(value.type) || value.type === "any" && typeof value.value === "function";
}
function isNotFunctionDataValue(value) {
  return !isFunctionDataValue(value);
}
function functionTypeToScalarType(functionType) {
  return functionType.slice(3, -1);
}
function arrayTypeToScalarType(arrayType) {
  return arrayType.slice(0, -2);
}
function getScalarTypeOf(type) {
  if (isArrayDataType(type)) {
    return arrayTypeToScalarType(type);
  }
  if (isFunctionDataType(type)) {
    return functionTypeToScalarType(type);
  }
  return type;
}
function unwrapDataValue(value) {
  if (!value) {
    return void 0;
  }
  if (isFunctionDataValue(value)) {
    return { type: functionTypeToScalarType(value.type), value: value.value() };
  }
  return value;
}
var arrayizeDataValue = (value) => {
  const isArray2 = value.type.endsWith("[]") || (value.type === "any" || value.type === "object") && Array.isArray(value.value);
  if (!isArray2) {
    return [value];
  }
  const unwrappedType = value.type.endsWith("[]") ? value.type.slice(0, -2) : value.type;
  return value.value.map((v) => ({ type: unwrappedType, value: v }));
};
var scalarDefaults = {
  string: "",
  number: 0,
  boolean: false,
  any: void 0,
  "chat-message": {
    type: "user",
    message: ""
  },
  "control-flow-excluded": void 0,
  date: (/* @__PURE__ */ new Date()).toISOString(),
  time: (/* @__PURE__ */ new Date()).toISOString(),
  datetime: (/* @__PURE__ */ new Date()).toISOString(),
  object: {},
  "gpt-tool": {
    name: "unknown",
    description: "",
    schema: {},
    namespace: void 0
  }
};
function getDefaultValue(type) {
  if (isArrayDataType(type)) {
    return [];
  }
  if (isFunctionDataType(type)) {
    return () => scalarDefaults[getScalarTypeOf(type)];
  }
  return scalarDefaults[getScalarTypeOf(type)];
}

// ../core/dist/model/NodeRegistration.js
var NodeRegistration = class {
  NodesType = void 0;
  NodeTypesType = void 0;
  #impls = {};
  #displayNames = {};
  register(definition) {
    const newRegistration = this;
    const typeStr = definition.impl.create().type;
    newRegistration.#impls[typeStr] = definition.impl;
    newRegistration.#displayNames[typeStr] = definition.displayName;
    return newRegistration;
  }
  create(type) {
    const implClass = this.#impls[type];
    if (!implClass) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return implClass.create();
  }
  createImpl(node) {
    const type = node.type;
    const impl = new this.#impls[type](node);
    if (!impl) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return impl;
  }
  getDisplayName(type) {
    return this.#displayNames[type];
  }
};

// ../core/dist/model/NodeImpl.js
var NodeImpl = class {
  chartNode;
  constructor(chartNode) {
    this.chartNode = chartNode;
  }
  get id() {
    return this.chartNode.id;
  }
  get type() {
    return this.chartNode.type;
  }
  get title() {
    return this.chartNode.title;
  }
  get visualData() {
    return this.chartNode.visualData;
  }
  get data() {
    return this.chartNode.data;
  }
  getEditors() {
    return [];
  }
};
function nodeDefinition(impl, displayName) {
  return {
    impl,
    displayName
  };
}

// ../core/dist/model/nodes/UserInputNode.js
var import_nanoid = require("nanoid");
var UserInputNodeImpl = class extends NodeImpl {
  static create(prompt = "This is an example question?") {
    const chartNode = {
      type: "userInput",
      title: "User Input",
      id: (0, import_nanoid.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        prompt,
        useInput: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    if (this.chartNode.data.useInput) {
      return [
        {
          dataType: "string[]",
          id: "questions",
          title: "Questions"
        }
      ];
    }
    return [];
  }
  getOutputDefinitions() {
    return [
      {
        dataType: "string[]",
        id: "output",
        title: "Answers Only"
      },
      {
        dataType: "string[]",
        id: "questionsAndAnswers",
        title: "Q & A"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "code",
        label: "Prompt",
        dataKey: "prompt",
        useInputToggleDataKey: "useInput",
        language: "plain-text"
      }
    ];
  }
  async process() {
    return {
      ["output"]: void 0,
      ["questionsAndAnswers"]: void 0
    };
  }
  getOutputValuesFromUserInput(questions, answers) {
    const questionsList = this.data.useInput ? expectType(questions["questions"], "string[]") : [this.data.prompt];
    return {
      ["output"]: answers,
      ["questionsAndAnswers"]: {
        type: "string[]",
        value: zip_default(questionsList, answers.value).map(([q, a]) => `${q}
${a}`)
      }
    };
  }
};
var userInputNode = nodeDefinition(UserInputNodeImpl, "User Input");

// ../core/dist/model/nodes/TextNode.js
var import_nanoid2 = require("nanoid");
var TextNodeImpl = class extends NodeImpl {
  static create(text = "{{input}}") {
    const chartNode = {
      type: "text",
      title: "Text",
      id: (0, import_nanoid2.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 300
      },
      data: {
        text
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    const inputNames = [...new Set(this.chartNode.data.text.match(/\{\{([^}]+)\}\}/g))];
    return (inputNames == null ? void 0 : inputNames.map((inputName) => {
      return {
        type: "string",
        // id and title should not have the {{ and }}
        id: inputName.slice(2, -2),
        title: inputName.slice(2, -2),
        dataType: "string",
        required: false
      };
    })) ?? [];
  }
  getOutputDefinitions() {
    return [
      {
        id: "output",
        title: "Output",
        dataType: "string"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "code",
        label: "Text",
        dataKey: "text",
        language: "prompt-interpolation",
        theme: "prompt-interpolation"
      }
    ];
  }
  interpolate(baseString, values2) {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values2[p1];
      return value !== void 0 ? value.toString() : "";
    });
  }
  async process(inputs) {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      const stringValue = coerceTypeOptional(inputs[key], "string") ?? "";
      acc[key] = stringValue;
      return acc;
    }, {});
    const outputValue = this.interpolate(this.chartNode.data.text, inputMap);
    return {
      output: {
        type: "string",
        value: outputValue
      }
    };
  }
};
var textNode = nodeDefinition(TextNodeImpl, "Text");

// ../core/dist/model/nodes/ChatNode.js
var import_nanoid3 = require("nanoid");

// ../core/dist/utils/tokenizer.js
var import_tiktoken = require("@dqbd/tiktoken");
var supportedModels = [
  "gpt-4",
  "gpt-4-32k",
  "gpt-4-tools",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-tools"
  //'text-davinci-003', 'code-davinci-002'
];
function getTokenCountForString(input, model) {
  const encoding = (0, import_tiktoken.encoding_for_model)(model);
  const encoded = encoding.encode(input);
  encoding.free();
  return encoded.length;
}
function getTokenCountForMessages(messages, model) {
  const encoding = (0, import_tiktoken.encoding_for_model)(model);
  const tokenCount = messages.reduce((sum, message) => {
    const encoded = encoding.encode(JSON.stringify(message));
    return sum + encoded.length;
  }, 0);
  encoding.free();
  return tokenCount;
}
var modelMaxTokens = {
  "gpt-4": 8192,
  "gpt-4-32k": 32768,
  "gpt-4-tools": 8192,
  "gpt-3.5-turbo": 4096,
  "gpt-3.5-turbo-tools": 4096
  // 'text-davinci-003': 4097,
  // 'code-davinci-002': 8001,
};
var modelToTiktokenModel = {
  "gpt-4": "gpt-4",
  "gpt-4-32k": "gpt-4-32k",
  "gpt-4-tools": "gpt-4",
  "gpt-3.5-turbo": "gpt-3.5-turbo",
  "gpt-3.5-turbo-tools": "gpt-3.5-turbo"
  // 'text-davinci-003': 'text-davinci-003',
  // 'code-davinci-002': 'code-davinci-002',
};
function assertValidModel(model) {
  if (!supportedModels.includes(model)) {
    throw new Error(`Invalid model: ${model}`);
  }
}
function chunkStringByTokenCount(input, targetTokenCount, model, overlapPercent) {
  overlapPercent = Number.isNaN(overlapPercent) ? 0 : Math.max(0, Math.min(1, overlapPercent));
  const chunks = [];
  const guess = Math.floor(targetTokenCount * (input.length / getTokenCountForString(input, model)));
  let remaining = input;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, guess));
    remaining = remaining.slice(guess - Math.floor(guess * overlapPercent));
  }
  return chunks;
}
var modelCost = {
  "gpt-4": { prompt: 0.03, completion: 0.06 },
  "gpt-4-32k": { prompt: 0.06, completion: 0.12 },
  "gpt-4-tools": { prompt: 0.03, completion: 0.06 },
  "gpt-3.5-turbo": { prompt: 2e-3, completion: 2e-3 },
  "gpt-3.5-turbo-tools": { prompt: 2e-3, completion: 2e-3 }
};
function getCostForTokens(tokenCount, type, model) {
  const costPerThousand = modelCost[model][type];
  return tokenCount / 1e3 * costPerThousand;
}
function getCostForPrompt(messages, model) {
  const tokenCount = getTokenCountForMessages(messages, modelToTiktokenModel[model]);
  return getCostForTokens(tokenCount, "prompt", model);
}
var modelDisplayNames = {
  "gpt-4": "GPT-4",
  "gpt-4-32k": "GPT-4 32k",
  "gpt-4-tools": "GPT-4 Tools",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gpt-3.5-turbo-tools": "GPT-3.5 Turbo Tools"
};
var modelOptions = Object.entries(modelDisplayNames).map(([value, label]) => ({ value, label }));

// ../core/dist/utils/outputs.js
function addWarning(outputs, warning) {
  if (!outputs[WarningsPort]) {
    outputs[WarningsPort] = { type: "string[]", value: [] };
  }
  outputs[WarningsPort].value.push(warning);
}
function getWarnings(outputs) {
  if (!(outputs == null ? void 0 : outputs[WarningsPort])) {
    return void 0;
  }
  return expectType(outputs[WarningsPort], "string[]");
}

// ../core/dist/utils/fetchEventSource.js
var EventSourceResponse = class extends Response {
  name;
  streams;
  constructor(body, init) {
    if (body == null) {
      super(null, init);
      this.name = "EventSourceResponse";
      this.streams = null;
      return;
    }
    const [bodyForString, bodyForEvents] = body.tee();
    const streams = createEventStream(bodyForEvents);
    super(bodyForString, init);
    this.name = "EventSourceResponse";
    this.streams = streams;
  }
  async *events() {
    if (this.streams == null) {
      return;
    }
    const reader = this.streams.eventStream.getReader();
    try {
      while (true) {
        const { done, value } = await this.raceWithTimeout(reader.read());
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }
  async raceWithTimeout(promise, timeout = 5e3) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timeout: API response took too long."));
      }, timeout);
      try {
        const result = await promise;
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }
};
async function fetchEventSource(url, init) {
  const headers = {
    ...init == null ? void 0 : init.headers,
    accept: "text/event-stream"
  };
  const response = await fetch(url, {
    ...init,
    headers
  });
  return new EventSourceResponse(response.body, response);
}
var lineSplitter = new class {
  separator;
  buffer = "";
  constructor(separator = /\n+/) {
    this.separator = separator;
  }
  transform(chunk, controller) {
    this.buffer += chunk;
    const lines = this.buffer.split(this.separator);
    this.buffer = lines.pop() ?? "";
    for (const line of lines) {
      controller.enqueue(line);
    }
  }
  flush(controller) {
    if (this.buffer.length > 0) {
      controller.enqueue(this.buffer);
      this.buffer = "";
    }
  }
}();
function createEventStream(body) {
  if (body == null) {
    return null;
  }
  const textStream = body.pipeThrough(new TextDecoderStream());
  const eventStream = textStream.pipeThrough(new TransformStream(lineSplitter)).pipeThrough(new TransformStream({
    transform(line, controller) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        controller.enqueue(data);
      }
    }
  }));
  return { eventStream, textStream };
}

// ../core/dist/utils/openai.js
var OpenAIError = class extends Error {
  status;
  responseJson;
  constructor(status, responseJson) {
    super(`OpenAIError: ${status} ${JSON.stringify(responseJson)}`);
    this.status = status;
    this.responseJson = responseJson;
    this.name = "OpenAIError";
  }
};
async function* streamChatCompletions({ auth, signal, ...rest }) {
  const defaultSignal = new AbortController().signal;
  const response = await fetchEventSource("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.apiKey}`,
      ...auth.organization ? { "OpenAI-Organization": auth.organization } : {}
    },
    body: JSON.stringify({
      ...rest,
      stream: true
    }),
    signal: signal ?? defaultSignal
  });
  let hadChunks = false;
  for await (const chunk of response.events()) {
    hadChunks = true;
    if (chunk === "[DONE]") {
      return;
    }
    let data;
    try {
      data = JSON.parse(chunk);
    } catch (err) {
      console.error("JSON parse failed on chunk: ", chunk);
      throw err;
    }
    yield data;
  }
  if (!hadChunks) {
    const responseJson = await response.json();
    throw new OpenAIError(response.status, responseJson);
  }
}

// ../../.yarn/cache/p-retry-npm-5.1.2-5426d97d26-f063c08b1a.zip/node_modules/p-retry/index.js
var import_retry = __toESM(require("retry"));
var networkErrorMsgs = /* @__PURE__ */ new Set([
  "Failed to fetch",
  // Chrome
  "NetworkError when attempting to fetch resource.",
  // Firefox
  "The Internet connection appears to be offline.",
  // Safari
  "Network request failed",
  // `cross-fetch`
  "fetch failed"
  // Undici (Node.js)
]);
var AbortError = class extends Error {
  constructor(message) {
    super();
    if (message instanceof Error) {
      this.originalError = message;
      ({ message } = message);
    } else {
      this.originalError = new Error(message);
      this.originalError.stack = this.stack;
    }
    this.name = "AbortError";
    this.message = message;
  }
};
var decorateErrorWithCounts = (error, attemptNumber, options) => {
  const retriesLeft = options.retries - (attemptNumber - 1);
  error.attemptNumber = attemptNumber;
  error.retriesLeft = retriesLeft;
  return error;
};
var isNetworkError = (errorMessage) => networkErrorMsgs.has(errorMessage);
var getDOMException = (errorMessage) => globalThis.DOMException === void 0 ? new Error(errorMessage) : new DOMException(errorMessage);
async function pRetry(input, options) {
  return new Promise((resolve, reject) => {
    options = {
      onFailedAttempt() {
      },
      retries: 10,
      ...options
    };
    const operation = import_retry.default.operation(options);
    operation.attempt(async (attemptNumber) => {
      try {
        resolve(await input(attemptNumber));
      } catch (error) {
        if (!(error instanceof Error)) {
          reject(new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`));
          return;
        }
        if (error instanceof AbortError) {
          operation.stop();
          reject(error.originalError);
        } else if (error instanceof TypeError && !isNetworkError(error.message)) {
          operation.stop();
          reject(error);
        } else {
          decorateErrorWithCounts(error, attemptNumber, options);
          try {
            await options.onFailedAttempt(error);
          } catch (error2) {
            reject(error2);
            return;
          }
          if (!operation.retry(error)) {
            reject(operation.mainError());
          }
        }
      }
    });
    if (options.signal && !options.signal.aborted) {
      options.signal.addEventListener("abort", () => {
        operation.stop();
        const reason = options.signal.reason === void 0 ? getDOMException("The operation was aborted.") : options.signal.reason;
        reject(reason instanceof Error ? reason : getDOMException(reason));
      }, {
        once: true
      });
    }
  });
}

// ../core/dist/model/nodes/ChatNode.js
var import_ts_pattern2 = require("ts-pattern");

// ../core/dist/utils/coerceType.js
var import_ts_pattern = require("ts-pattern");

// ../core/dist/utils/expectType.js
function expectType(value, type) {
  if (isArrayDataType(type) && isScalarDataValue(value) && getScalarTypeOf(type) === value.type) {
    return [value.value];
  }
  if (type === "any" || type === "any[]" || (value == null ? void 0 : value.type) === "any" || (value == null ? void 0 : value.type) === "any[]") {
    return value == null ? void 0 : value.value;
  }
  if (isFunctionDataType(type) && (value == null ? void 0 : value.type) === `fn<${type}>` || type === "fn<any>") {
    return () => value.value;
  }
  if ((value == null ? void 0 : value.type) !== type) {
    throw new Error(`Expected value of type ${type} but got ${value == null ? void 0 : value.type}`);
  }
  return value.value;
}
function expectTypeOptional(value, type) {
  if (value === void 0) {
    return void 0;
  }
  if (isArrayDataType(type) && isScalarDataValue(value) && getScalarTypeOf(type) === value.type) {
    return [value.value];
  }
  if (isFunctionDataType(value.type) && value.type === `fn<${type}>`) {
    value = unwrapDataValue(value);
  }
  if (value.type !== type) {
    throw new Error(`Expected value of type ${type} but got ${value == null ? void 0 : value.type}`);
  }
  return value.value;
}

// ../core/dist/utils/coerceType.js
function coerceTypeOptional(wrapped, type) {
  const value = wrapped ? unwrapDataValue(wrapped) : void 0;
  if (isArrayDataType(type) && !isArrayDataValue(value)) {
    const coerced = coerceTypeOptional(value, getScalarTypeOf(type));
    if (coerced === void 0) {
      return void 0;
    }
    return [coerced];
  }
  const result = (0, import_ts_pattern.match)(type).with("string", () => {
    if (!value) {
      return "";
    }
    if (isArrayDataValue(value)) {
      return value.value.map((v) => coerceTypeOptional({ type: value.type.replace("[]", ""), value: v }, "string")).join("\n");
    }
    if (value.type === "string") {
      return value.value;
    }
    if (value.type === "boolean") {
      return value.value.toString();
    }
    if (value.type === "number") {
      return value.value.toString();
    }
    if (value.type === "date") {
      return value.value;
    }
    if (value.type === "time") {
      return value.value;
    }
    if (value.type === "datetime") {
      return value.value;
    }
    if (value.type === "chat-message") {
      return value.value.message;
    }
    if (value.value === void 0) {
      return void 0;
    }
    if (value.value === null) {
      return void 0;
    }
    if (value.type === "any") {
      const inferred = inferType(value.value);
      return coerceTypeOptional(inferred, "string");
    }
    return JSON.stringify(value.value);
  }).with("boolean", () => {
    if (!value || !value.value) {
      return false;
    }
    if (isArrayDataValue(value)) {
      return value.value.map((v) => coerceTypeOptional({ type: value.type.replace("[]", ""), value: v }, "boolean")).every((v) => v);
    }
    if (value.type === "string") {
      return value.value.length > 0 && value.value !== "false";
    }
    if (value.type === "boolean") {
      return value.value;
    }
    if (value.type === "number") {
      return value.value !== 0;
    }
    if (value.type === "date") {
      return true;
    }
    if (value.type === "time") {
      return true;
    }
    if (value.type === "datetime") {
      return true;
    }
    if (value.type === "chat-message") {
      return value.value.message.length > 0;
    }
    return !!value.value;
  }).with("chat-message", () => {
    if (!value || value.value == null) {
      return void 0;
    }
    if (value.type === "chat-message") {
      return value.value;
    }
    if (value.type === "string") {
      return { type: "user", message: value.value };
    }
    if (value.type === "object" && "type" in value.value && "message" in value.value) {
      return value.value;
    }
    if (value.type === "any") {
      const inferred = inferType(value.value);
      return coerceTypeOptional(inferred, "chat-message");
    }
  }).with("number", () => {
    if (!value || value.value == null) {
      return void 0;
    }
    if (isArrayDataValue(value)) {
      return void 0;
    }
    if (value.type === "string") {
      return parseFloat(value.value);
    }
    if (value.type === "boolean") {
      return value.value ? 1 : 0;
    }
    if (value.type === "number") {
      return value.value;
    }
    if (value.type === "date") {
      return new Date(value.value).valueOf();
    }
    if (value.type === "time") {
      return new Date(value.value).valueOf();
    }
    if (value.type === "datetime") {
      return new Date(value.value).valueOf();
    }
    if (value.type === "chat-message") {
      return parseFloat(value.value.message);
    }
    if (value.type === "any") {
      const inferred = inferType(value.value);
      return coerceTypeOptional(inferred, "number");
    }
    if (value.type === "object") {
      const inferred = inferType(value.value);
      return coerceTypeOptional(inferred, "number");
    }
    return void 0;
  }).with("object", () => {
    if (!value || value.value == null) {
      return void 0;
    }
    return value.value;
  }).otherwise(() => {
    if (!value) {
      return value;
    }
    if (getScalarTypeOf(value.type) === "any" || getScalarTypeOf(type) === "any") {
      return value.value;
    }
    return expectTypeOptional(value, type);
  });
  return result;
}
function coerceType(value, type) {
  const result = coerceTypeOptional(value, type);
  if (result === void 0) {
    throw new Error(`Expected value of type ${type} but got undefined`);
  }
  return result;
}
function inferType(value) {
  if (value === void 0) {
    return { type: "any", value: void 0 };
  }
  if (value === null) {
    return { type: "any", value: null };
  }
  if (typeof value === "function") {
    return { type: "fn<any>", value };
  }
  if (typeof value === "string") {
    return { type: "string", value };
  }
  if (typeof value === "boolean") {
    return { type: "boolean", value };
  }
  if (typeof value === "number") {
    return { type: "number", value };
  }
  if (value instanceof Date) {
    return { type: "datetime", value: value.toISOString() };
  }
  if (typeof value === "object") {
    return { type: "object", value };
  }
  throw new Error(`Cannot infer type of value: ${value}`);
}

// ../core/dist/model/nodes/ChatNode.js
var cache = /* @__PURE__ */ new Map();
var ChatNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "chat",
      title: "Chat",
      id: (0, import_nanoid3.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {
        model: "gpt-3.5-turbo",
        useModelInput: false,
        temperature: 0.5,
        useTemperatureInput: false,
        top_p: 1,
        useTopPInput: false,
        useTopP: false,
        useUseTopPInput: false,
        maxTokens: 1024,
        useMaxTokensInput: false,
        useStop: false,
        stop: "",
        useStopInput: false,
        presencePenalty: 0,
        usePresencePenaltyInput: false,
        frequencyPenalty: 0,
        useFrequencyPenaltyInput: false,
        user: void 0,
        useUserInput: false,
        enableToolUse: false,
        cache: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    const inputs = [];
    inputs.push({
      id: "systemPrompt",
      title: "System Prompt",
      dataType: "string",
      required: false
    });
    if (this.data.useModelInput) {
      inputs.push({
        id: "model",
        title: "Model",
        dataType: "string",
        required: false
      });
    }
    if (this.data.useTemperatureInput) {
      inputs.push({
        dataType: "number",
        id: "temperature",
        title: "Temperature"
      });
    }
    if (this.data.useTopPInput) {
      inputs.push({
        dataType: "number",
        id: "top_p",
        title: "Top P"
      });
    }
    if (this.data.useUseTopPInput) {
      inputs.push({
        dataType: "boolean",
        id: "useTopP",
        title: "Use Top P"
      });
    }
    if (this.data.useMaxTokensInput) {
      inputs.push({
        dataType: "number",
        id: "maxTokens",
        title: "Max Tokens"
      });
    }
    if (this.data.useStopInput) {
      inputs.push({
        dataType: "string",
        id: "stop",
        title: "Stop"
      });
    }
    if (this.data.usePresencePenaltyInput) {
      inputs.push({
        dataType: "number",
        id: "presencePenalty",
        title: "Presence Penalty"
      });
    }
    if (this.data.useFrequencyPenaltyInput) {
      inputs.push({
        dataType: "number",
        id: "frequencyPenalty",
        title: "Frequency Penalty"
      });
    }
    if (this.data.useUserInput) {
      inputs.push({
        dataType: "string",
        id: "user",
        title: "User"
      });
    }
    if (this.data.useNumberOfChoicesInput) {
      inputs.push({
        dataType: "number",
        id: "numberOfChoices",
        title: "Number of Choices"
      });
    }
    inputs.push({
      dataType: ["chat-message", "chat-message[]"],
      id: "prompt",
      title: "Prompt"
    });
    if (this.data.enableToolUse) {
      inputs.push({
        dataType: ["gpt-tool", "gpt-tool[]"],
        id: "tools",
        title: "Tools"
      });
    }
    return inputs;
  }
  getOutputDefinitions() {
    const outputs = [];
    if (this.data.useNumberOfChoicesInput || (this.data.numberOfChoices ?? 1) > 1) {
      outputs.push({
        dataType: "string[]",
        id: "response",
        title: "Responses"
      });
    } else {
      outputs.push({
        dataType: "string",
        id: "response",
        title: "Response"
      });
    }
    if (this.data.enableToolUse) {
      outputs.push({
        dataType: "object",
        id: "tool-call",
        title: "Tool Call"
      });
    }
    return outputs;
  }
  getEditors() {
    return [
      {
        type: "dropdown",
        label: "Model",
        dataKey: "model",
        useInputToggleDataKey: "useModelInput",
        options: modelOptions
      },
      {
        type: "number",
        label: "Temperature",
        dataKey: "temperature",
        useInputToggleDataKey: "useTemperatureInput",
        min: 0,
        max: 2,
        step: 0.1
      },
      {
        type: "number",
        label: "Top P",
        dataKey: "top_p",
        useInputToggleDataKey: "useTopPInput",
        min: 0,
        max: 1,
        step: 0.1
      },
      {
        type: "toggle",
        label: "Use Top P",
        dataKey: "useTopP",
        useInputToggleDataKey: "useUseTopPInput"
      },
      {
        type: "number",
        label: "Max Tokens",
        dataKey: "maxTokens",
        useInputToggleDataKey: "useMaxTokensInput",
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        step: 1
      },
      {
        type: "string",
        label: "Stop",
        dataKey: "stop",
        useInputToggleDataKey: "useStopInput"
      },
      {
        type: "number",
        label: "Presence Penalty",
        dataKey: "presencePenalty",
        useInputToggleDataKey: "usePresencePenaltyInput",
        min: 0,
        max: 2,
        step: 0.1
      },
      {
        type: "number",
        label: "Frequency Penalty",
        dataKey: "frequencyPenalty",
        useInputToggleDataKey: "useFrequencyPenaltyInput",
        min: 0,
        max: 2,
        step: 0.1
      },
      {
        type: "string",
        label: "User",
        dataKey: "user",
        useInputToggleDataKey: "useUserInput"
      },
      {
        type: "number",
        label: "Number of Choices",
        dataKey: "numberOfChoices",
        useInputToggleDataKey: "useNumberOfChoicesInput",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 1
      },
      {
        type: "toggle",
        label: "Enable Tool Use",
        dataKey: "enableToolUse"
      },
      {
        type: "toggle",
        label: "Cache (same inputs, same outputs)",
        dataKey: "cache"
      }
    ];
  }
  async process(inputs, context) {
    const output = {};
    const model = this.data.useModelInput ? coerceTypeOptional(inputs["model"], "string") ?? this.data.model : this.data.model;
    assertValidModel(model);
    const temperature = this.data.useTemperatureInput ? coerceTypeOptional(inputs["temperature"], "number") ?? this.data.temperature : this.data.temperature;
    const topP = this.data.useTopPInput ? coerceTypeOptional(inputs["top_p"], "number") ?? this.data.top_p : this.data.top_p;
    const useTopP = this.data.useUseTopPInput ? coerceTypeOptional(inputs["useTopP"], "boolean") ?? this.data.useTopP : this.data.useTopP;
    const stop = this.data.useStopInput ? this.data.useStop ? coerceTypeOptional(inputs["stop"], "string") ?? this.data.stop : void 0 : this.data.stop;
    const presencePenalty = this.data.usePresencePenaltyInput ? coerceTypeOptional(inputs["presencePenalty"], "number") ?? this.data.presencePenalty : this.data.presencePenalty;
    const frequencyPenalty = this.data.useFrequencyPenaltyInput ? coerceTypeOptional(inputs["frequencyPenalty"], "number") ?? this.data.frequencyPenalty : this.data.frequencyPenalty;
    const numberOfChoices = this.data.useNumberOfChoicesInput ? coerceTypeOptional(inputs["numberOfChoices"], "number") ?? this.data.numberOfChoices ?? 1 : this.data.numberOfChoices ?? 1;
    const prompt = inputs["prompt"];
    if (!prompt) {
      throw new Error("Prompt is required");
    }
    const tools = expectTypeOptional(inputs["tools"], "gpt-tool[]");
    let messages = (0, import_ts_pattern2.match)(prompt).with({ type: "chat-message" }, (p) => [p.value]).with({ type: "chat-message[]" }, (p) => p.value).with({ type: "string" }, (p) => [{ type: "user", message: p.value }]).with({ type: "string[]" }, (p) => p.value.map((v) => ({ type: "user", message: v }))).otherwise((p) => {
      if (isArrayDataValue(p)) {
        const stringValues = p.value.map((v) => coerceType({
          type: getScalarTypeOf(p.type),
          value: v
        }, "string"));
        return stringValues.filter((v) => v != null).map((v) => ({ type: "user", message: v }));
      }
      const coercedMessage = coerceType(p, "chat-message");
      if (coercedMessage != null) {
        return [coercedMessage];
      }
      const coercedString = coerceType(p, "string");
      return coercedString != null ? [{ type: "user", message: coerceType(p, "string") }] : [];
    });
    const systemPrompt = inputs["systemPrompt"];
    if (systemPrompt) {
      messages = [{ type: "system", message: coerceType(systemPrompt, "string") }, ...messages];
    }
    const toolMap = (tools ?? []).reduce((acc, tool) => {
      if (tool.namespace) {
        const existing = acc[tool.namespace] ?? {};
        const namespace = {
          ...existing,
          // TODO
          description: tool.namespace,
          tools: {
            ...existing.tools,
            [tool.name]: {
              type: "tool",
              description: tool.description,
              schema: tool.schema
            }
          }
        };
        return {
          ...acc,
          [tool.namespace]: namespace
        };
      } else {
        return {
          ...acc,
          [tool.name]: {
            type: "tool",
            description: tool.description,
            schema: tool.schema
          }
        };
      }
    }, {});
    const completionMessages = messages.map((message) => ({
      content: message.message,
      role: message.type
    }));
    let { maxTokens } = this.data;
    const tokenCount = getTokenCountForMessages(completionMessages, modelToTiktokenModel[model]);
    if (tokenCount >= modelMaxTokens[model]) {
      throw new Error(`The model ${model} can only handle ${modelMaxTokens[model]} tokens, but ${tokenCount} were provided in the prompts alone.`);
    }
    if (tokenCount + maxTokens > modelMaxTokens[model]) {
      const message = `The model can only handle a maximum of ${modelMaxTokens[model]} tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${modelMaxTokens[model] - tokenCount}.`;
      addWarning(output, message);
      maxTokens = Math.floor((modelMaxTokens[model] - tokenCount) * 0.95);
    }
    const isMultiResponse = this.data.useNumberOfChoicesInput || (this.data.numberOfChoices ?? 1) > 1;
    try {
      return await pRetry(async () => {
        var _a, _b, _c, _d;
        const options = {
          messages: completionMessages,
          model,
          temperature: useTopP ? void 0 : temperature,
          top_p: useTopP ? topP : void 0,
          max_tokens: maxTokens,
          n: numberOfChoices,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
          stop: stop || void 0,
          tools: Object.keys(toolMap).length === 0 ? void 0 : toolMap,
          format: this.data.enableToolUse ? "merged" : void 0
        };
        const cacheKey = JSON.stringify(options);
        if (this.data.cache) {
          const cached = cache.get(cacheKey);
          if (cached) {
            return cached;
          }
        }
        const chunks = streamChatCompletions({
          auth: {
            apiKey: context.settings.openAiKey,
            organization: context.settings.openAiOrganization
          },
          signal: context.signal,
          ...options
        });
        let responseChoicesParts = [];
        let toolCallChoicesParts = [];
        for await (const chunk of chunks) {
          for (const { delta, index } of chunk.choices) {
            if (delta.content != null) {
              responseChoicesParts[index] ??= [];
              responseChoicesParts[index].push(delta.content);
            }
            if (delta.tool_call) {
              toolCallChoicesParts[index] ??= [];
              toolCallChoicesParts[index].push(delta.tool_call);
            }
          }
          if (isMultiResponse) {
            output["response"] = {
              type: "string[]",
              value: responseChoicesParts.map((parts) => parts.join(""))
            };
          } else {
            output["response"] = {
              type: "string",
              value: ((_a = responseChoicesParts[0]) == null ? void 0 : _a.join("")) ?? ""
            };
          }
          if (toolCallChoicesParts.length > 0) {
            try {
              if (isMultiResponse) {
                const toolCallJsons = toolCallChoicesParts.map((choiceParts) => JSON.parse(choiceParts.join("")));
                output["tool-call"] = {
                  type: "object[]",
                  value: toolCallJsons
                };
              } else {
                const toolCallJson = JSON.parse(((_b = toolCallChoicesParts[0]) == null ? void 0 : _b.join("")) ?? "");
                output["tool-call"] = {
                  type: "object",
                  value: toolCallJson
                };
              }
            } catch (err) {
              if (isMultiResponse) {
                output["tool-call"] = {
                  type: "string[]",
                  value: toolCallChoicesParts.map((parts) => parts.join(""))
                };
              } else {
                output["tool-call"] = {
                  type: "string",
                  value: ((_c = toolCallChoicesParts[0]) == null ? void 0 : _c.join("")) ?? ""
                };
              }
            }
          }
          (_d = context.onPartialOutputs) == null ? void 0 : _d.call(context, output);
        }
        if (responseChoicesParts.length === 0 && toolCallChoicesParts.length === 0) {
          throw new Error("No response from OpenAI");
        }
        const requestTokenCount = getTokenCountForMessages(completionMessages, modelToTiktokenModel[model]);
        output["requestTokens"] = { type: "number", value: requestTokenCount * numberOfChoices };
        const responseTokenCount = responseChoicesParts.map((choiceParts) => getTokenCountForString(choiceParts.join(), modelToTiktokenModel[model])).reduce((a, b) => a + b, 0);
        output["responseTokens"] = { type: "number", value: responseTokenCount };
        const cost = getCostForPrompt(completionMessages, model) + getCostForTokens(responseTokenCount, "completion", model);
        output["cost"] = { type: "number", value: cost };
        Object.freeze(output);
        cache.set(cacheKey, output);
        return output;
      }, {
        forever: true,
        maxRetryTime: 1e3 * 60 * 5,
        factor: 2.5,
        minTimeout: 500,
        maxTimeout: 5e3,
        randomize: true,
        signal: context.signal,
        onFailedAttempt(err) {
          var _a;
          context.trace(`ChatNode failed, retrying: ${err.toString()}`);
          const { retriesLeft } = err;
          if (!(err instanceof OpenAIError)) {
            return;
          }
          if (err.status === 429) {
            if (retriesLeft) {
              (_a = context.onPartialOutputs) == null ? void 0 : _a.call(context, {
                ["response"]: {
                  type: "string",
                  value: "OpenAI API rate limit exceeded, retrying..."
                }
              });
              return;
            }
          }
          if (err.status >= 400 && err.status < 500) {
            throw new Error(err.message);
          }
        }
      });
    } catch (error) {
      throw new Error(`Error processing ChatNode: ${error.message}`);
    }
  }
};
var chatNode = nodeDefinition(ChatNodeImpl, "Chat");

// ../core/dist/model/nodes/PromptNode.js
var import_nanoid4 = require("nanoid");
var PromptNodeImpl = class extends NodeImpl {
  static create(promptText = "{{input}}") {
    const chartNode = {
      type: "prompt",
      title: "Prompt",
      id: (0, import_nanoid4.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        type: "user",
        useTypeInput: false,
        promptText
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    let inputs = [];
    if (this.data.useTypeInput) {
      inputs.push({
        id: "type",
        title: "Type",
        dataType: "string"
      });
    }
    if (this.data.useNameInput) {
      inputs.push({
        id: "name",
        title: "Name",
        dataType: "string"
      });
    }
    const inputNames = this.chartNode.data.promptText.match(/\{\{([^}]+)\}\}/g);
    inputs = [
      ...inputs,
      ...(inputNames == null ? void 0 : inputNames.map((inputName) => {
        return {
          // id and title should not have the {{ and }}
          id: inputName.slice(2, -2),
          title: inputName.slice(2, -2),
          dataType: "string",
          required: false
        };
      })) ?? []
    ];
    return inputs;
  }
  getOutputDefinitions() {
    return [
      {
        id: "output",
        title: "Output",
        dataType: "chat-message"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "dropdown",
        label: "Type",
        options: [
          { value: "system", label: "System" },
          { value: "user", label: "User" },
          { value: "assistant", label: "Assistant" },
          { value: "tool", label: "Tool" }
        ],
        dataKey: "type",
        useInputToggleDataKey: "useTypeInput"
      },
      {
        type: "string",
        label: "Name",
        dataKey: "name",
        useInputToggleDataKey: "useNameInput"
      },
      {
        type: "code",
        label: "Prompt Text",
        dataKey: "promptText",
        language: "prompt-interpolation",
        theme: "prompt-interpolation"
      }
    ];
  }
  interpolate(baseString, values2) {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values2[p1];
      return value !== void 0 ? value : "";
    });
  }
  async process(inputs) {
    const inputMap = mapValues_default(inputs, (input) => coerceType(input, "string"));
    const outputValue = this.interpolate(this.chartNode.data.promptText, inputMap);
    return {
      ["output"]: {
        type: "chat-message",
        value: {
          type: this.chartNode.data.type,
          message: outputValue
        }
      }
    };
  }
};
var promptNode = nodeDefinition(PromptNodeImpl, "Prompt");

// ../core/dist/model/nodes/ExtractRegexNode.js
var import_nanoid5 = require("nanoid");
var ExtractRegexNodeImpl = class extends NodeImpl {
  static create(regex = "([a-zA-Z]+)") {
    const chartNode = {
      type: "extractRegex",
      title: "Extract Regex",
      id: (0, import_nanoid5.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        regex,
        useRegexInput: false,
        errorOnFailed: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    const inputs = [
      {
        id: "input",
        title: "Input",
        dataType: "string",
        required: true
      }
    ];
    if (this.chartNode.data.useRegexInput) {
      inputs.push({
        id: "regex",
        title: "Regex",
        dataType: "string",
        required: false
      });
    }
    return inputs;
  }
  getOutputDefinitions() {
    const regex = this.chartNode.data.regex;
    try {
      const regExp = new RegExp(regex, "g");
      const captureGroupCount = countCaptureGroups(regExp);
      const outputs = [];
      for (let i = 0; i < captureGroupCount; i++) {
        outputs.push({
          id: `output${i + 1}`,
          title: `Output ${i + 1}`,
          dataType: "string"
        });
      }
      outputs.push({
        id: "matches",
        title: "Matches",
        dataType: "string[]"
      });
      outputs.push({
        id: "succeeded",
        title: "Succeeded",
        dataType: "boolean"
      }, {
        id: "failed",
        title: "Failed",
        dataType: "boolean"
      });
      return outputs;
    } catch (err) {
      return [];
    }
  }
  getEditors() {
    return [
      {
        type: "toggle",
        label: "Error on failed",
        dataKey: "errorOnFailed"
      },
      {
        type: "code",
        label: "Regex",
        dataKey: "regex",
        useInputToggleDataKey: "useRegexInput",
        language: "regex"
      }
    ];
  }
  async process(inputs) {
    const inputString = expectType(inputs["input"], "string");
    const regex = expectTypeOptional(inputs["regex"], "string") ?? this.chartNode.data.regex;
    const regExp = new RegExp(regex, "g");
    let matches = [];
    let match4;
    let firstMatch;
    while ((match4 = regExp.exec(inputString)) !== null) {
      if (!firstMatch) {
        firstMatch = match4;
      }
      matches.push(match4[1]);
    }
    matches = matches.filter((m) => m);
    if (matches.length === 0 && this.chartNode.data.errorOnFailed) {
      throw new Error(`No match found for regex ${regex}`);
    }
    const outputArray = {
      type: "string[]",
      value: matches
    };
    if (!firstMatch) {
      if (this.chartNode.data.errorOnFailed) {
        throw new Error(`No match found for regex ${regex}`);
      }
      return {
        ["succeeded"]: {
          type: "boolean",
          value: false
        },
        ["failed"]: {
          type: "boolean",
          value: true
        }
      };
    }
    const output = {
      ["succeeded"]: {
        type: "boolean",
        value: true
      },
      ["failed"]: {
        type: "boolean",
        value: false
      }
    };
    output["matches"] = outputArray;
    for (let i = 1; i < firstMatch.length; i++) {
      output[`output${i}`] = {
        type: "string",
        value: firstMatch[i]
      };
    }
    return output;
  }
};
function countCaptureGroups(regex) {
  const regexSource = regex.source;
  let count = 0;
  let inCharacterClass = false;
  for (let i = 0; i < regexSource.length; i++) {
    const currentChar = regexSource[i];
    const prevChar = i > 0 ? regexSource[i - 1] : null;
    if (currentChar === "[" && prevChar !== "\\") {
      inCharacterClass = true;
    } else if (currentChar === "]" && prevChar !== "\\") {
      inCharacterClass = false;
    } else if (currentChar === "(" && prevChar !== "\\" && !inCharacterClass) {
      if (regexSource[i + 1] !== "?" || regexSource[i + 2] === ":") {
        count++;
      }
    }
  }
  return count;
}
var extractRegexNode = nodeDefinition(ExtractRegexNodeImpl, "Extract Regex");

// ../core/dist/model/nodes/CodeNode.js
var import_nanoid6 = require("nanoid");
var CodeNodeImpl = class extends NodeImpl {
  static create(code = `// This is a code node, you can write and JS in here and it will be executed.
// Inputs are accessible via an object \`inputs\` and data is typed (i.e. inputs.foo.type, inputs.foo.value)
// Return an object with named outputs that match the output names specified in the node's config.
// Output values must by typed as well (e.g. { bar: { type: 'string', value: 'bar' } }
return { output: inputs.input };`, inputNames = "input", outputNames = "output") {
    const chartNode = {
      type: "code",
      title: "Code",
      id: (0, import_nanoid6.nanoid)(),
      visualData: {
        x: 0,
        y: 0
      },
      data: {
        code,
        inputNames,
        outputNames
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    return this.chartNode.data.inputNames.split(",").map((inputName) => {
      return {
        type: "string",
        id: inputName.trim(),
        title: inputName.trim(),
        dataType: "string",
        required: false
      };
    });
  }
  getOutputDefinitions() {
    return this.chartNode.data.outputNames.split(",").map((outputName) => {
      return {
        id: outputName.trim(),
        title: outputName.trim(),
        dataType: "string"
      };
    });
  }
  getEditors() {
    return [
      {
        type: "code",
        label: "Code",
        dataKey: "code",
        language: "javascript"
      }
    ];
  }
  async process(inputs) {
    const codeFunction = new Function("inputs", this.chartNode.data.code);
    const outputs = codeFunction(inputs);
    return outputs;
  }
};
var codeNode = nodeDefinition(CodeNodeImpl, "Code");

// ../core/dist/model/nodes/MatchNode.js
var import_nanoid7 = require("nanoid");
var MatchNodeImpl = class extends NodeImpl {
  static create(caseCount = 2, cases = ["YES", "NO"]) {
    const chartNode = {
      type: "match",
      title: "Match",
      id: (0, import_nanoid7.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 300
      },
      data: {
        caseCount,
        cases
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    const inputs = [
      {
        id: "input",
        title: "Input",
        dataType: "string",
        required: true
      }
    ];
    return inputs;
  }
  getOutputDefinitions() {
    const outputs = [];
    for (let i = 0; i < this.chartNode.data.caseCount; i++) {
      outputs.push({
        id: `case${i + 1}`,
        title: `Case ${i + 1}`,
        dataType: "string"
      });
    }
    outputs.push({
      id: "unmatched",
      title: "Unmatched",
      dataType: "string"
    });
    return outputs;
  }
  async process(inputs) {
    const inputString = coerceType(inputs.input, "string");
    const cases = this.chartNode.data.cases;
    let matched = false;
    const output = {};
    for (let i = 0; i < cases.length; i++) {
      const regExp = new RegExp(cases[i]);
      const match4 = regExp.test(inputString);
      if (match4) {
        matched = true;
        output[`case${i + 1}`] = {
          type: "string",
          value: inputString
        };
      } else {
        output[`case${i + 1}`] = {
          type: "control-flow-excluded",
          value: void 0
        };
      }
    }
    if (!matched) {
      output.unmatched = {
        type: "string",
        value: inputString
      };
    } else {
      output.unmatched = {
        type: "control-flow-excluded",
        value: void 0
      };
    }
    return output;
  }
};
var matchNode = nodeDefinition(MatchNodeImpl, "Match");

// ../core/dist/model/nodes/IfNode.js
var import_nanoid8 = require("nanoid");
var IfNodeImpl = class extends NodeImpl {
  getInputDefinitions() {
    return [
      {
        id: "if",
        title: "If",
        dataType: "string"
      },
      {
        id: "value",
        title: "Value",
        dataType: "string"
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "output",
        title: "Output",
        dataType: "string"
      }
    ];
  }
  async process(inputData) {
    const ifValue = inputData["if"];
    const value = inputData["value"] ?? { type: "any", value: void 0 };
    const excluded = {
      output: {
        type: "control-flow-excluded",
        value: void 0
      }
    };
    if (!ifValue) {
      return excluded;
    }
    if (ifValue.type === "control-flow-excluded") {
      return excluded;
    }
    if (ifValue.type === "string" && !ifValue.value) {
      return excluded;
    }
    if (ifValue.type === "boolean" && !ifValue.value) {
      return excluded;
    }
    if (ifValue.type.endsWith("[]") && ifValue.value.length === 0) {
      return excluded;
    }
    return {
      ["output"]: value
    };
  }
};
__publicField(IfNodeImpl, "create", () => {
  const chartNode = {
    type: "if",
    title: "If",
    id: (0, import_nanoid8.nanoid)(),
    data: {},
    visualData: {
      x: 0,
      y: 0,
      width: 100
    }
  };
  return chartNode;
});
var ifNode = nodeDefinition(IfNodeImpl, "If");

// ../core/dist/model/nodes/ReadDirectoryNode.js
var import_nanoid9 = require("nanoid");
var ReadDirectoryNodeImpl = class extends NodeImpl {
  static create() {
    return {
      id: (0, import_nanoid9.nanoid)(),
      type: "readDirectory",
      title: "Read Directory",
      visualData: { x: 0, y: 0 },
      data: {
        path: "examples",
        recursive: false,
        usePathInput: false,
        useRecursiveInput: false,
        includeDirectories: false,
        useIncludeDirectoriesInput: false,
        filterGlobs: [],
        useFilterGlobsInput: false,
        relative: false,
        useRelativeInput: false,
        ignores: [],
        useIgnoresInput: false
      }
    };
  }
  getInputDefinitions() {
    const inputDefinitions = [];
    if (this.chartNode.data.usePathInput) {
      inputDefinitions.push({
        id: "path",
        title: "Path",
        dataType: "string",
        required: true
      });
    }
    if (this.chartNode.data.useRecursiveInput) {
      inputDefinitions.push({
        id: "recursive",
        title: "Recursive",
        dataType: "boolean",
        required: true
      });
    }
    if (this.chartNode.data.useIncludeDirectoriesInput) {
      inputDefinitions.push({
        id: "includeDirectories",
        title: "Include Directories",
        dataType: "boolean",
        required: true
      });
    }
    if (this.chartNode.data.useFilterGlobsInput) {
      inputDefinitions.push({
        id: "filterGlobs",
        title: "Filter Globs",
        dataType: "string[]",
        required: true
      });
    }
    if (this.chartNode.data.useRelativeInput) {
      inputDefinitions.push({
        id: "relative",
        title: "Relative",
        dataType: "boolean",
        required: true
      });
    }
    return inputDefinitions;
  }
  getOutputDefinitions() {
    return [
      {
        id: "rootPath",
        title: "Root Path",
        dataType: "string"
      },
      {
        id: "paths",
        title: "Paths",
        dataType: "string[]"
      }
    ];
  }
  async process(inputData, context) {
    const path = this.chartNode.data.usePathInput ? expectType(inputData["path"], "string") : this.chartNode.data.path;
    const recursive = this.chartNode.data.useRecursiveInput ? expectType(inputData["recursive"], "boolean") : this.chartNode.data.recursive;
    const includeDirectories = this.chartNode.data.useIncludeDirectoriesInput ? expectType(inputData["includeDirectories"], "boolean") : this.chartNode.data.includeDirectories;
    const filterGlobs = this.chartNode.data.useFilterGlobsInput ? expectType(inputData["filterGlobs"], "string[]") : this.chartNode.data.filterGlobs;
    const relative = this.chartNode.data.useRelativeInput ? expectType(inputData["relative"], "boolean") : this.chartNode.data.relative;
    const ignores = this.chartNode.data.useIgnoresInput ? expectType(inputData["ignores"], "string[]") : this.chartNode.data.ignores;
    const cacheKey = `ReadDirectoryNode-${path}-${recursive}-${includeDirectories}-${filterGlobs.join()}-${relative}-${ignores == null ? void 0 : ignores.join()}`;
    const cached = context.executionCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const files = await context.nativeApi.readdir(path, void 0, {
      recursive,
      includeDirectories,
      filterGlobs,
      relative,
      ignores
    });
    const outputs = {
      ["paths"]: { type: "string[]", value: files },
      ["rootPath"]: { type: "string", value: path }
    };
    context.executionCache.set(cacheKey, outputs);
    return outputs;
  }
};
var readDirectoryNode = nodeDefinition(ReadDirectoryNodeImpl, "Read Directory");

// ../core/dist/model/nodes/ReadFileNode.js
var import_nanoid10 = require("nanoid");
var ReadFileNodeImpl = class extends NodeImpl {
  static create() {
    return {
      id: (0, import_nanoid10.nanoid)(),
      type: "readFile",
      title: "Read File",
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        path: "",
        usePathInput: true,
        errorOnMissingFile: false
      }
    };
  }
  getInputDefinitions() {
    const inputDefinitions = [];
    if (this.chartNode.data.usePathInput) {
      inputDefinitions.push({
        id: "path",
        title: "Path",
        dataType: "string"
      });
    }
    return inputDefinitions;
  }
  getOutputDefinitions() {
    return [
      {
        id: "content",
        title: "Content",
        dataType: "string"
      }
    ];
  }
  async process(inputData, context) {
    const path = this.chartNode.data.usePathInput ? expectType(inputData["path"], "string") : this.chartNode.data.path;
    try {
      const content = await context.nativeApi.readTextFile(path, void 0);
      return {
        ["content"]: { type: "string", value: content }
      };
    } catch (err) {
      if (this.chartNode.data.errorOnMissingFile) {
        throw err;
      } else {
        return {
          ["content"]: { type: "string", value: "(file does not exist)" }
        };
      }
    }
  }
};
var readFileNode = nodeDefinition(ReadFileNodeImpl, "Read File");

// ../core/dist/model/nodes/IfElseNode.js
var import_nanoid11 = require("nanoid");
var IfElseNodeImpl = class extends NodeImpl {
  getInputDefinitions() {
    return [
      {
        id: "if",
        title: "If",
        dataType: "any"
      },
      {
        id: "true",
        title: "True",
        dataType: "any"
      },
      {
        id: "false",
        title: "False",
        dataType: "any"
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "output",
        title: "Output",
        dataType: "any"
      }
    ];
  }
  async process(inputData) {
    const ifValue = inputData["if"];
    const trueValue = inputData["true"] ?? { type: "any", value: void 0 };
    const falseValue = inputData["false"] ?? { type: "any", value: void 0 };
    if (!(trueValue || falseValue)) {
      return {
        ["output"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    if ((ifValue == null ? void 0 : ifValue.type) === "control-flow-excluded") {
      return {
        ["output"]: falseValue
      };
    }
    if (inputData[ControlFlowExcludedPort]) {
      return {
        ["output"]: falseValue
      };
    }
    if ((ifValue == null ? void 0 : ifValue.type) && ifValue.type === "boolean") {
      return {
        ["output"]: ifValue.value ? trueValue : falseValue
      };
    }
    if ((ifValue == null ? void 0 : ifValue.type) === "string") {
      return {
        ["output"]: ifValue.value.length > 0 ? trueValue : falseValue
      };
    }
    if ((ifValue == null ? void 0 : ifValue.type) === "chat-message") {
      return {
        ["output"]: ifValue.value.message.length > 0 ? trueValue : falseValue
      };
    }
    if (ifValue == null ? void 0 : ifValue.type.endsWith("[]")) {
      return {
        ["output"]: ifValue.value.length > 0 ? trueValue : falseValue
      };
    }
    if ((ifValue == null ? void 0 : ifValue.type) === "any" || (ifValue == null ? void 0 : ifValue.type) === "object") {
      return {
        ["output"]: !!ifValue.value ? trueValue : falseValue
      };
    }
    return {
      ["output"]: falseValue
    };
  }
};
__publicField(IfElseNodeImpl, "create", () => {
  const chartNode = {
    type: "ifElse",
    title: "If/Else",
    id: (0, import_nanoid11.nanoid)(),
    data: {},
    visualData: {
      x: 0,
      y: 0,
      width: 125
    }
  };
  return chartNode;
});
var ifElseNode = nodeDefinition(IfElseNodeImpl, "If/Else");

// ../core/dist/model/nodes/ChunkNode.js
var import_nanoid12 = require("nanoid");
var ChunkNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "chunk",
      title: "Chunk",
      id: (0, import_nanoid12.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {
        model: "gpt-3.5-turbo",
        useModelInput: false,
        numTokensPerChunk: 1024,
        overlap: 0
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [
      {
        id: "input",
        title: "Input",
        dataType: "string"
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "chunks",
        title: "Chunks",
        dataType: "string[]"
      },
      {
        id: "first",
        title: "First",
        dataType: "string"
      },
      {
        id: "last",
        title: "Last",
        dataType: "string"
      },
      {
        id: "indexes",
        title: "Indexes",
        dataType: "number[]"
      },
      {
        id: "count",
        title: "Count",
        dataType: "number"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "dropdown",
        label: "Model",
        dataKey: "model",
        options: modelOptions,
        useInputToggleDataKey: "useModelInput"
      },
      {
        type: "number",
        label: "Number of tokens per chunk",
        dataKey: "numTokensPerChunk",
        min: 1,
        max: 32768,
        step: 1
      },
      {
        type: "number",
        label: "Overlap (in %)",
        dataKey: "overlap",
        min: 0,
        max: 100,
        step: 1
      }
    ];
  }
  async process(inputs) {
    const input = coerceType(inputs["input"], "string");
    const overlapPercent = this.chartNode.data.overlap / 100;
    const chunked = chunkStringByTokenCount(input, this.chartNode.data.numTokensPerChunk, modelToTiktokenModel[this.chartNode.data.model], overlapPercent);
    return {
      ["chunks"]: {
        type: "string[]",
        value: chunked
      },
      ["first"]: {
        type: "string",
        value: chunked[0]
      },
      ["last"]: {
        type: "string",
        value: chunked.at(-1)
      },
      ["indexes"]: {
        type: "number[]",
        value: chunked.map((_, i) => i + 1)
      },
      ["count"]: {
        type: "number",
        value: chunked.length
      }
    };
  }
};
var chunkNode = nodeDefinition(ChunkNodeImpl, "Chunk");

// ../core/dist/model/nodes/GraphInputNode.js
var import_nanoid13 = require("nanoid");
var GraphInputNodeImpl = class extends NodeImpl {
  static create(id = "input", dataType = "string") {
    const chartNode = {
      type: "graphInput",
      title: "Graph Input",
      id: (0, import_nanoid13.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 300
      },
      data: {
        id,
        dataType,
        defaultValue: void 0,
        useDefaultValueInput: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    if (this.data.useDefaultValueInput) {
      return [
        {
          id: "default",
          title: "Default Value",
          dataType: this.chartNode.data.dataType
        }
      ];
    }
    return [];
  }
  getOutputDefinitions() {
    return [
      {
        id: "data",
        title: this.data.id,
        dataType: this.chartNode.data.dataType
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "ID",
        dataKey: "id"
      },
      {
        type: "dataTypeSelector",
        label: "Data Type",
        dataKey: "dataType"
      },
      {
        type: "anyData",
        label: "Default Value",
        dataKey: "defaultValue",
        useInputToggleDataKey: "useDefaultValueInput"
      }
    ];
  }
  async process(inputs, context) {
    let inputValue = context.graphInputs[this.data.id] == null ? void 0 : coerceTypeOptional(context.graphInputs[this.data.id], this.data.dataType);
    if (inputValue == null && this.data.useDefaultValueInput) {
      inputValue = coerceTypeOptional(inputs["default"], this.data.dataType);
    }
    if (inputValue == null) {
      inputValue = coerceTypeOptional(inferType(this.data.defaultValue), this.data.dataType) || getDefaultValue(this.data.dataType);
    }
    if (inputValue == null && isArrayDataType(this.data.dataType)) {
      inputValue = { type: this.data.dataType, value: [] };
    }
    const value = {
      type: this.data.dataType,
      value: inputValue
    };
    return { ["data"]: value };
  }
};
var graphInputNode = nodeDefinition(GraphInputNodeImpl, "Graph Input");

// ../core/dist/model/nodes/GraphOutputNode.js
var import_nanoid14 = require("nanoid");
var GraphOutputNodeImpl = class extends NodeImpl {
  static create(id = "output", dataType = "string") {
    const chartNode = {
      type: "graphOutput",
      title: "Graph Output",
      id: (0, import_nanoid14.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 300
      },
      data: {
        id,
        dataType
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [
      {
        id: "value",
        title: this.data.id,
        dataType: this.chartNode.data.dataType
      }
    ];
  }
  getOutputDefinitions() {
    return [];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "ID",
        dataKey: "id"
      },
      {
        type: "dataTypeSelector",
        label: "Data Type",
        dataKey: "dataType"
      }
    ];
  }
  async process(inputs, context) {
    var _a;
    const value = inputs["value"] ?? { type: "any", value: void 0 };
    const isExcluded = value.type === "control-flow-excluded" || inputs[ControlFlowExcludedPort] != null;
    if (isExcluded && context.graphOutputs[this.data.id] == null) {
      context.graphOutputs[this.data.id] = {
        type: "control-flow-excluded",
        value: void 0
      };
    } else if (context.graphOutputs[this.data.id] == null || ((_a = context.graphOutputs[this.data.id]) == null ? void 0 : _a.type) === "control-flow-excluded") {
      context.graphOutputs[this.data.id] = value;
    }
    if (isExcluded) {
      return {
        ["value"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    return inputs;
  }
};
var graphOutputNode = nodeDefinition(GraphOutputNodeImpl, "Graph Output");

// ../core/dist/model/nodes/SubGraphNode.js
var import_nanoid15 = require("nanoid");
var SubGraphNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "subGraph",
      title: "Subgraph",
      id: (0, import_nanoid15.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 300
      },
      data: {
        graphId: ""
      }
    };
    return chartNode;
  }
  getInputDefinitions(_connections, _nodes, project) {
    const graph = project.graphs[this.data.graphId];
    if (!graph) {
      return [];
    }
    const inputNodes = graph.nodes.filter((node) => node.type === "graphInput");
    const inputIds = [...new Set(inputNodes.map((node) => node.data.id))].sort();
    return inputIds.map((id) => ({
      id,
      title: id,
      dataType: inputNodes.find((node) => node.data.id === id).data.dataType
    }));
  }
  getOutputDefinitions(_connections, _nodes, project) {
    const graph = project.graphs[this.data.graphId];
    if (!graph) {
      return [];
    }
    const outputNodes = graph.nodes.filter((node) => node.type === "graphOutput");
    const outputIds = [...new Set(outputNodes.map((node) => node.data.id))].sort();
    return outputIds.map((id) => ({
      id,
      title: id,
      dataType: outputNodes.find((node) => node.data.id === id).data.dataType
    }));
  }
  async process(inputs, context) {
    const { project } = context;
    if (!project) {
      throw new Error("SubGraphNode requires a project to be set in the context.");
    }
    const subGraphProcessor = context.createSubProcessor(this.data.graphId);
    const subGraphOutputs = await subGraphProcessor.processGraph(context, inputs, context.contextValues);
    return subGraphOutputs;
  }
};
var subGraphNode = nodeDefinition(SubGraphNodeImpl, "Subgraph");

// ../core/dist/model/nodes/ArrayNode.js
var import_nanoid16 = require("nanoid");

// ../core/dist/utils/typeSafety.js
var entries = (object) => object == null ? [] : Object.entries(object);
function fromEntries(entries_) {
  return Object.fromEntries(entries_);
}
function values(o) {
  return Object.values(o);
}

// ../core/dist/model/nodes/ArrayNode.js
var ArrayNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "array",
      title: "Array",
      id: (0, import_nanoid16.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {
        flatten: true
      }
    };
    return chartNode;
  }
  getInputDefinitions(connections) {
    const inputs = [];
    const inputCount = this.#getInputPortCount(connections);
    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: "any",
        id: `input${i}`,
        title: `Input ${i}`
      });
    }
    return inputs;
  }
  getOutputDefinitions() {
    return [
      {
        dataType: "any[]",
        id: "output",
        title: "Output"
      },
      {
        dataType: "number[]",
        id: "indices",
        title: "Indices"
      }
    ];
  }
  getEditors() {
    return [{ type: "toggle", label: "Flatten", dataKey: "flatten" }];
  }
  #getInputPortCount(connections) {
    const inputNodeId = this.chartNode.id;
    const inputConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith("input"));
    let maxInputNumber = 0;
    for (const connection of inputConnections) {
      const inputNumber = parseInt(connection.inputId.replace("input", ""));
      if (inputNumber > maxInputNumber) {
        maxInputNumber = inputNumber;
      }
    }
    return maxInputNumber + 1;
  }
  async process(inputs) {
    const outputArray = [];
    for (const [key, input] of entries(inputs)) {
      if (key.startsWith("input")) {
        if (this.data.flatten) {
          if (Array.isArray(input == null ? void 0 : input.value)) {
            for (const value of (input == null ? void 0 : input.value) ?? []) {
              outputArray.push(value);
            }
          } else {
            outputArray.push(input == null ? void 0 : input.value);
          }
        } else {
          outputArray.push(input == null ? void 0 : input.value);
        }
      }
    }
    return {
      ["output"]: {
        type: "any[]",
        value: outputArray
      },
      ["indices"]: {
        type: "number[]",
        value: outputArray.map((_, index) => index)
      }
    };
  }
};
var arrayNode = nodeDefinition(ArrayNodeImpl, "Array");

// ../core/dist/model/nodes/ExtractJsonNode.js
var import_nanoid17 = require("nanoid");
var ExtractJsonNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "extractJson",
      title: "Extract JSON",
      id: (0, import_nanoid17.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {}
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [
      {
        id: "input",
        title: "Input",
        dataType: "string",
        required: true
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "output",
        title: "Output",
        dataType: "object"
      },
      {
        id: "noMatch",
        title: "No Match",
        dataType: "string"
      }
    ];
  }
  async process(inputs) {
    const inputString = expectType(inputs["input"], "string");
    const firstBracket = inputString.indexOf("{");
    const lastBracket = inputString.lastIndexOf("}");
    const firstSquareBracket = inputString.indexOf("[");
    const lastSquareBracket = inputString.lastIndexOf("]");
    const firstIndex = Math.min(firstBracket, firstSquareBracket);
    const lastIndex = Math.max(lastBracket, lastSquareBracket);
    const substring = inputString.substring(firstIndex, lastIndex + 1);
    let jsonObject = void 0;
    try {
      jsonObject = JSON.parse(substring);
    } catch (err) {
      return {
        ["noMatch"]: {
          type: "string",
          value: inputString
        },
        ["output"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    return {
      ["output"]: {
        type: "object",
        value: jsonObject
      },
      ["noMatch"]: {
        type: "control-flow-excluded",
        value: void 0
      }
    };
  }
};
var extractJsonNode = nodeDefinition(ExtractJsonNodeImpl, "Extract JSON");

// ../core/dist/model/nodes/AssemblePromptNode.js
var import_nanoid18 = require("nanoid");
var AssemblePromptNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "assemblePrompt",
      title: "Assemble Prompt",
      id: (0, import_nanoid18.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {}
    };
    return chartNode;
  }
  getInputDefinitions(connections) {
    const inputs = [];
    const messageCount = this.#getMessagePortCount(connections);
    for (let i = 1; i <= messageCount; i++) {
      inputs.push({
        dataType: ["chat-message", "chat-message[]"],
        id: `message${i}`,
        title: `Message ${i}`
      });
    }
    return inputs;
  }
  getOutputDefinitions() {
    return [
      {
        dataType: "chat-message[]",
        id: "prompt",
        title: "Prompt"
      }
    ];
  }
  #getMessagePortCount(connections) {
    const inputNodeId = this.chartNode.id;
    const messageConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith("message"));
    let maxMessageNumber = 0;
    for (const connection of messageConnections) {
      const messageNumber = parseInt(connection.inputId.replace("message", ""));
      if (messageNumber > maxMessageNumber) {
        maxMessageNumber = messageNumber;
      }
    }
    return maxMessageNumber + 1;
  }
  async process(inputs) {
    const output = {};
    const outMessages = [];
    const inputMessages = orderBy_default(Object.entries(inputs).filter(([key]) => key.startsWith("message")), ([key]) => key, "asc");
    for (const [, inputMessage] of inputMessages) {
      if (!inputMessage || inputMessage.type === "control-flow-excluded" || !inputMessage.value) {
        continue;
      }
      const inMessages = arrayizeDataValue(unwrapDataValue(inputMessage));
      for (const message of inMessages) {
        if (message.type === "chat-message") {
          outMessages.push(message.value);
        } else {
          const coerced = coerceType(message, "string");
          if (coerced) {
            outMessages.push({ type: "user", message: coerced });
          }
        }
      }
    }
    output["prompt"] = {
      type: "chat-message[]",
      value: outMessages
    };
    return output;
  }
};
var assemblePromptNode = nodeDefinition(AssemblePromptNodeImpl, "Assemble Prompt");

// ../core/dist/model/nodes/ExtractYamlNode.js
var import_nanoid19 = require("nanoid");
var import_yaml = __toESM(require("yaml"));
var jp = __toESM(require("jsonpath"));
var ExtractYamlNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "extractYaml",
      title: "Extract YAML",
      id: (0, import_nanoid19.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        rootPropertyName: "yamlDocument"
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [
      {
        id: "input",
        title: "Input",
        dataType: "string",
        required: true
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "output",
        title: "Output",
        dataType: "object"
      },
      {
        id: "matches",
        title: "Matches",
        dataType: "any[]"
      },
      {
        id: "noMatch",
        title: "No Match",
        dataType: "string"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "Root Property Name",
        dataKey: "rootPropertyName"
      },
      {
        type: "code",
        label: "Object Path",
        dataKey: "objectPath",
        language: "jsonpath"
      }
    ];
  }
  async process(inputs) {
    var _a, _b;
    const inputString = expectType(inputs["input"], "string");
    const match4 = new RegExp(`^${this.data.rootPropertyName}:`, "m").exec(inputString);
    const rootPropertyStart = (match4 == null ? void 0 : match4.index) ?? -1;
    const nextLines = inputString.slice(rootPropertyStart).split("\n");
    const yamlLines = [nextLines.shift()];
    while (((_a = nextLines[0]) == null ? void 0 : _a.startsWith(" ")) || ((_b = nextLines[0]) == null ? void 0 : _b.startsWith("	")) || nextLines[0] === "") {
      yamlLines.push(nextLines.shift());
    }
    const potentialYaml = yamlLines.join("\n");
    let yamlObject = void 0;
    try {
      yamlObject = import_yaml.default.parse(potentialYaml);
    } catch (err) {
      return {
        ["noMatch"]: {
          type: "string",
          value: potentialYaml
        },
        ["output"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    if (!(yamlObject == null ? void 0 : yamlObject.hasOwnProperty(this.data.rootPropertyName))) {
      return {
        ["noMatch"]: {
          type: "string",
          value: potentialYaml
        },
        ["output"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    let matches = [];
    if (this.data.objectPath) {
      try {
        const extractedValue = jp.query(yamlObject, this.data.objectPath);
        matches = extractedValue;
        yamlObject = extractedValue.length > 0 ? extractedValue[0] : void 0;
      } catch (err) {
        return {
          ["noMatch"]: {
            type: "string",
            value: potentialYaml
          },
          ["output"]: {
            type: "control-flow-excluded",
            value: void 0
          },
          ["matches"]: {
            type: "control-flow-excluded",
            value: void 0
          }
        };
      }
    }
    return {
      ["output"]: yamlObject === void 0 ? {
        type: "control-flow-excluded",
        value: void 0
      } : this.data.objectPath ? {
        type: "any",
        value: yamlObject
      } : {
        type: "object",
        value: yamlObject
      },
      ["noMatch"]: {
        type: "control-flow-excluded",
        value: void 0
      },
      ["matches"]: {
        type: "any[]",
        value: matches
      }
    };
  }
};
var extractYamlNode = nodeDefinition(ExtractYamlNodeImpl, "Extract YAML");

// ../core/dist/model/nodes/LoopControllerNode.js
var import_nanoid20 = require("nanoid");
var LoopControllerNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "loopController",
      title: "Loop Controller",
      id: (0, import_nanoid20.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        maxIterations: 100
      }
    };
    return chartNode;
  }
  getInputDefinitions(connections, nodes) {
    const inputs = [];
    const messageCount = this.#getInputPortCount(connections);
    inputs.push({
      dataType: "any",
      id: "continue",
      title: "Continue"
    });
    let i = 1;
    for (; i <= messageCount + 1; i++) {
      const input = {
        dataType: "any",
        id: `input${i}`,
        title: `Input ${i}`
      };
      const inputConnection = connections.find((connection) => connection.inputId === input.id);
      if (inputConnection && nodes[inputConnection.outputNodeId]) {
        input.title = nodes[inputConnection.outputNodeId].title;
      }
      const inputDefault = {
        dataType: "any",
        id: `input${i}Default`,
        title: `Input ${i} Default`
      };
      const inputDefaultConnection = connections.find((connection) => connection.inputId === inputDefault.id);
      if (inputDefaultConnection && nodes[inputDefaultConnection.outputNodeId]) {
        inputDefault.title = nodes[inputDefaultConnection.outputNodeId].title;
      }
      inputs.push(input);
      inputs.push(inputDefault);
    }
    return inputs;
  }
  getOutputDefinitions(connections, nodes) {
    const messageCount = this.#getInputPortCount(connections);
    const outputs = [];
    outputs.push({
      dataType: "any",
      id: "break",
      title: "Break"
    });
    for (let i = 1; i <= messageCount; i++) {
      const output = {
        dataType: "any",
        id: `output${i}`,
        title: `Output ${i}`
      };
      const inputConnection = connections.find((connection) => connection.inputId === `input${i}`);
      if (inputConnection && nodes[inputConnection.outputNodeId]) {
        output.title = `${nodes[inputConnection.outputNodeId].title}?`;
      }
      outputs.push(output);
    }
    return outputs;
  }
  getEditors() {
    return [
      {
        type: "number",
        label: "Max Iterations",
        dataKey: "maxIterations"
      }
    ];
  }
  #getInputPortCount(connections) {
    const inputNodeId = this.chartNode.id;
    const messageConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith("input"));
    let maxMessageNumber = 0;
    for (const connection of messageConnections) {
      const messageNumber = parseInt(connection.inputId.replace("input", ""));
      if (messageNumber > maxMessageNumber) {
        maxMessageNumber = messageNumber;
      }
    }
    return maxMessageNumber;
  }
  async process(inputs, context) {
    const output = {};
    let continueValue = false;
    if (inputs["continue"] === void 0) {
      continueValue = true;
    } else {
      let continueDataValue = inputs["continue"];
      if (continueDataValue.type === "control-flow-excluded") {
        continueValue = false;
      } else {
        continueValue = coerceType(continueDataValue, "boolean");
      }
    }
    if (continueValue) {
      output["break"] = { type: "control-flow-excluded", value: "loop-not-broken" };
    } else {
      output["break"] = { type: "boolean", value: true };
    }
    const inputCount = Object.keys(inputs).filter((key) => key.startsWith("input") && !key.endsWith("Default")).length;
    for (let i = 1; i <= inputCount; i++) {
      if (continueValue) {
        const inputId = `input${i}`;
        const outputId = `output${i}`;
        if (inputs[inputId]) {
          output[outputId] = inputs[inputId];
        } else {
          output[outputId] = inputs[`${inputId}Default`];
        }
      } else {
        output[`output${i}`] = { type: "control-flow-excluded", value: void 0 };
      }
    }
    return output;
  }
};
var loopControllerNode = nodeDefinition(LoopControllerNodeImpl, "Loop Controller");

// ../core/dist/model/nodes/TrimChatMessagesNode.js
var import_nanoid21 = require("nanoid");
var TrimChatMessagesNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "trimChatMessages",
      title: "Trim Chat Messages",
      id: (0, import_nanoid21.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {
        maxTokenCount: 4096,
        removeFromBeginning: true,
        model: "gpt-3.5-turbo"
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [
      {
        id: "input",
        title: "Input",
        dataType: "chat-message[]"
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "trimmed",
        title: "Trimmed",
        dataType: "chat-message[]"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "number",
        label: "Max Token Count",
        dataKey: "maxTokenCount"
      },
      {
        type: "toggle",
        label: "Remove From Beginning",
        dataKey: "removeFromBeginning"
      },
      {
        type: "dropdown",
        label: "Model",
        dataKey: "model",
        options: modelOptions
      }
    ];
  }
  async process(inputs) {
    const input = expectType(inputs["input"], "chat-message[]");
    const maxTokenCount = this.chartNode.data.maxTokenCount;
    const removeFromBeginning = this.chartNode.data.removeFromBeginning;
    const model = "gpt-3.5-turbo";
    const tiktokenModel = modelToTiktokenModel[model];
    let trimmedMessages = [...input];
    let tokenCount = getTokenCountForMessages(trimmedMessages.map((message) => ({ content: message.message, role: message.type })), tiktokenModel);
    while (tokenCount > maxTokenCount) {
      if (removeFromBeginning) {
        trimmedMessages.shift();
      } else {
        trimmedMessages.pop();
      }
      tokenCount = getTokenCountForMessages(trimmedMessages.map((message) => ({ content: message.message, role: message.type })), tiktokenModel);
    }
    return {
      ["trimmed"]: {
        type: "chat-message[]",
        value: trimmedMessages
      }
    };
  }
};
var trimChatMessagesNode = nodeDefinition(TrimChatMessagesNodeImpl, "Trim Chat Messages");

// ../core/dist/model/nodes/ExternalCallNode.js
var import_nanoid22 = require("nanoid");

// ../core/dist/utils/errors.js
function getError(error) {
  const errorInstance = typeof error === "object" && error instanceof Error ? error : new Error(error != null ? error.toString() : "Unknown error");
  return errorInstance;
}

// ../core/dist/model/nodes/ExternalCallNode.js
var ExternalCallNodeImpl = class extends NodeImpl {
  static create() {
    return {
      id: (0, import_nanoid22.nanoid)(),
      type: "externalCall",
      title: "External Call",
      visualData: { x: 0, y: 0, width: 150 },
      data: {
        functionName: "",
        useFunctionNameInput: false,
        useErrorOutput: false
      }
    };
  }
  getInputDefinitions() {
    const inputDefinitions = [];
    if (this.chartNode.data.useFunctionNameInput) {
      inputDefinitions.push({
        id: "functionName",
        title: "Function Name",
        dataType: "string"
      });
    }
    inputDefinitions.push({
      id: "arguments",
      title: "Arguments",
      dataType: "any[]"
    });
    return inputDefinitions;
  }
  getOutputDefinitions() {
    const outputs = [
      {
        id: "result",
        title: "Result",
        dataType: "any"
      }
    ];
    if (this.chartNode.data.useErrorOutput) {
      outputs.push({
        id: "error",
        title: "Error",
        dataType: "string"
      });
    }
    return outputs;
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "Function Name",
        dataKey: "functionName",
        useInputToggleDataKey: "useFunctionNameInput"
      },
      {
        type: "toggle",
        label: "Use Error Output",
        dataKey: "useErrorOutput"
      }
    ];
  }
  async process(inputs, context) {
    const functionName = this.chartNode.data.useFunctionNameInput ? coerceType(inputs["functionName"], "string") : this.chartNode.data.functionName;
    let args = inputs["arguments"];
    let arrayArgs = {
      type: "any[]",
      value: []
    };
    if (args) {
      if (args.type.endsWith("[]") === false) {
        arrayArgs = {
          type: "any[]",
          value: [args.value]
        };
      } else {
        arrayArgs = args;
      }
    }
    const fn = context.externalFunctions[functionName];
    if (!fn) {
      throw new Error(`Function ${functionName} not was not defined using setExternalCall`);
    }
    if (this.data.useErrorOutput) {
      try {
        const result2 = await fn(...arrayArgs.value);
        return {
          ["result"]: result2,
          ["error"]: {
            type: "control-flow-excluded",
            value: void 0
          }
        };
      } catch (error) {
        return {
          ["result"]: {
            type: "control-flow-excluded",
            value: void 0
          },
          ["error"]: {
            type: "string",
            value: getError(error).message
          }
        };
      }
    }
    const result = await fn(...arrayArgs.value);
    return {
      ["result"]: result
    };
  }
};
var externalCallNode = nodeDefinition(ExternalCallNodeImpl, "External Call");

// ../core/dist/model/nodes/ExtractObjectPathNode.js
var import_nanoid23 = require("nanoid");
var jp2 = __toESM(require("jsonpath"));
var ExtractObjectPathNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "extractObjectPath",
      title: "Extract Object Path",
      id: (0, import_nanoid23.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        path: "$",
        usePathInput: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    const inputDefinitions = [
      {
        id: "object",
        title: "Object",
        dataType: "object",
        required: true
      }
    ];
    if (this.chartNode.data.usePathInput) {
      inputDefinitions.push({
        id: "path",
        title: "Path",
        dataType: "string",
        required: true
      });
    }
    return inputDefinitions;
  }
  getOutputDefinitions() {
    return [
      {
        id: "match",
        title: "Match",
        dataType: "any"
      },
      {
        id: "all_matches",
        title: "All Matches",
        dataType: "any[]"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "code",
        label: "Path",
        dataKey: "path",
        language: "jsonpath",
        useInputToggleDataKey: "usePathInput"
      }
    ];
  }
  async process(inputs) {
    const inputObject = coerceTypeOptional(inputs["object"], "object");
    const inputPath = this.chartNode.data.usePathInput ? expectType(inputs["path"], "string") : this.chartNode.data.path;
    if (!inputPath) {
      throw new Error("Path input is not provided");
    }
    let matches;
    try {
      matches = jp2.query(inputObject, inputPath);
    } catch (err) {
      matches = [];
    }
    if (matches.length === 0) {
      return {
        ["match"]: {
          type: "control-flow-excluded",
          value: void 0
        },
        ["all_matches"]: {
          type: "any[]",
          value: []
        }
      };
    }
    return {
      ["match"]: {
        type: "any",
        value: matches[0]
      },
      ["all_matches"]: {
        type: "any[]",
        value: matches
      }
    };
  }
};
var extractObjectPathNode = nodeDefinition(ExtractObjectPathNodeImpl, "Extract Object Path");

// ../core/dist/model/nodes/RaiseEventNode.js
var import_nanoid24 = require("nanoid");
var RaiseEventNodeImpl = class extends NodeImpl {
  static create() {
    return {
      id: (0, import_nanoid24.nanoid)(),
      type: "raiseEvent",
      title: "Raise Event",
      visualData: { x: 0, y: 0, width: 150 },
      data: {
        eventName: "toast",
        useEventNameInput: false
      }
    };
  }
  getInputDefinitions() {
    const inputDefinitions = [];
    if (this.chartNode.data.useEventNameInput) {
      inputDefinitions.push({
        id: "eventName",
        title: "Event Name",
        dataType: "string"
      });
    }
    inputDefinitions.push({
      id: "data",
      title: "Data",
      dataType: "any"
    });
    return inputDefinitions;
  }
  getOutputDefinitions() {
    return [
      {
        id: "result",
        title: "Result",
        dataType: "any"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "Event Name",
        dataKey: "eventName",
        useInputToggleDataKey: "useEventNameInput"
      }
    ];
  }
  async process(inputs, context) {
    const eventName = this.chartNode.data.useEventNameInput ? coerceType(inputs["eventName"], "string") : this.chartNode.data.eventName;
    const eventData = inputs["data"];
    context.raiseEvent(eventName, eventData);
    return {
      result: eventData
    };
  }
};
var raiseEventNode = nodeDefinition(RaiseEventNodeImpl, "Raise Event");

// ../core/dist/model/nodes/ContextNode.js
var import_nanoid25 = require("nanoid");
var ContextNodeImpl = class extends NodeImpl {
  static create(id = "input", dataType = "string") {
    const chartNode = {
      type: "context",
      title: "Context",
      id: (0, import_nanoid25.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 300
      },
      data: {
        id,
        dataType,
        defaultValue: void 0,
        useDefaultValueInput: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    if (this.data.useDefaultValueInput) {
      return [
        {
          id: "default",
          title: "Default Value",
          dataType: this.chartNode.data.dataType
        }
      ];
    }
    return [];
  }
  getOutputDefinitions() {
    return [
      {
        id: "data",
        title: this.data.id,
        dataType: this.chartNode.data.dataType
      }
    ];
  }
  getEditors() {
    return [
      { type: "string", label: "ID", dataKey: "id" },
      { type: "dataTypeSelector", label: "Data Type", dataKey: "dataType" },
      {
        type: "anyData",
        label: "Default Value",
        dataKey: "defaultValue",
        useInputToggleDataKey: "useDefaultValueInput"
      }
    ];
  }
  async process(inputs, context) {
    const contextValue = context.contextValues[this.data.id];
    if (contextValue !== void 0) {
      return {
        ["data"]: contextValue
      };
    }
    let defaultValue;
    if (this.data.useDefaultValueInput) {
      defaultValue = inputs["default"];
    } else {
      defaultValue = { type: this.data.dataType, value: this.data.defaultValue };
    }
    return {
      ["data"]: defaultValue
    };
  }
};
var contextNode = nodeDefinition(ContextNodeImpl, "Context");

// ../core/dist/model/nodes/CoalesceNode.js
var import_nanoid26 = require("nanoid");
var _getInputPortCount, getInputPortCount_fn;
var CoalesceNodeImpl = class extends NodeImpl {
  constructor() {
    super(...arguments);
    __privateAdd(this, _getInputPortCount);
  }
  getInputDefinitions(connections) {
    const inputs = [];
    const inputCount = __privateMethod(this, _getInputPortCount, getInputPortCount_fn).call(this, connections);
    inputs.push({
      dataType: "boolean",
      id: "conditional",
      title: "Conditional"
    });
    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: "any",
        id: `input${i}`,
        title: `Input ${i}`
      });
    }
    return inputs;
  }
  getOutputDefinitions() {
    return [
      {
        dataType: "any",
        id: "output",
        title: "Output"
      }
    ];
  }
  async process(inputData) {
    const conditional = inputData["conditional"];
    if ((conditional == null ? void 0 : conditional.type) === "control-flow-excluded") {
      return {
        ["output"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    const inputCount = Object.keys(inputData).filter((key) => key.startsWith("input")).length;
    const okInputValues = [];
    for (let i = 1; i <= inputCount; i++) {
      const inputValue = inputData[`input${i}`];
      if (inputValue && inputValue.type !== "control-flow-excluded" && coerceType(inputValue, "boolean")) {
        okInputValues.push(inputValue);
      }
    }
    if (okInputValues.length === 0) {
      return {
        ["output"]: {
          type: "control-flow-excluded",
          value: void 0
        }
      };
    }
    return {
      ["output"]: okInputValues[0]
    };
  }
};
_getInputPortCount = new WeakSet();
getInputPortCount_fn = function(connections) {
  const inputNodeId = this.chartNode.id;
  const inputConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith("input"));
  let maxInputNumber = 0;
  for (const connection of inputConnections) {
    const messageNumber = parseInt(connection.inputId.replace("input", ""), 10);
    if (messageNumber > maxInputNumber) {
      maxInputNumber = messageNumber;
    }
  }
  return maxInputNumber + 1;
};
__publicField(CoalesceNodeImpl, "create", () => {
  const chartNode = {
    type: "coalesce",
    title: "Coalesce",
    id: (0, import_nanoid26.nanoid)(),
    data: {},
    visualData: {
      x: 0,
      y: 0,
      width: 150
    }
  };
  return chartNode;
});
var coalesceNode = nodeDefinition(CoalesceNodeImpl, "Coalesce");

// ../core/dist/model/nodes/PassthroughNode.js
var import_nanoid27 = require("nanoid");
var _getInputPortCount2, getInputPortCount_fn2;
var PassthroughNodeImpl = class extends NodeImpl {
  constructor() {
    super(...arguments);
    __privateAdd(this, _getInputPortCount2);
  }
  getInputDefinitions(connections) {
    const inputs = [];
    const inputCount = __privateMethod(this, _getInputPortCount2, getInputPortCount_fn2).call(this, connections);
    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: "any",
        id: `input${i}`,
        title: `Input ${i}`
      });
    }
    return inputs;
  }
  getOutputDefinitions(connections) {
    const outputs = [];
    const inputCount = __privateMethod(this, _getInputPortCount2, getInputPortCount_fn2).call(this, connections);
    for (let i = 1; i <= inputCount - 1; i++) {
      outputs.push({
        dataType: "any",
        id: `output${i}`,
        title: `Output ${i}`
      });
    }
    return outputs;
  }
  async process(inputData) {
    const inputCount = Object.keys(inputData).filter((key) => key.startsWith("input")).length;
    const outputs = {};
    for (let i = 1; i <= inputCount; i++) {
      const input = inputData[`input${i}`];
      outputs[`output${i}`] = input;
    }
    return outputs;
  }
};
_getInputPortCount2 = new WeakSet();
getInputPortCount_fn2 = function(connections) {
  const inputNodeId = this.chartNode.id;
  const inputConnections = connections.filter((connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith("input"));
  let maxInputNumber = 0;
  for (const connection of inputConnections) {
    const messageNumber = parseInt(connection.inputId.replace("input", ""), 10);
    if (messageNumber > maxInputNumber) {
      maxInputNumber = messageNumber;
    }
  }
  return maxInputNumber + 1;
};
__publicField(PassthroughNodeImpl, "create", () => {
  const chartNode = {
    type: "passthrough",
    title: "Passthrough",
    id: (0, import_nanoid27.nanoid)(),
    data: {},
    visualData: {
      x: 0,
      y: 0,
      width: 175
    }
  };
  return chartNode;
});
var passthroughNode = nodeDefinition(PassthroughNodeImpl, "Passthrough");

// ../core/dist/model/nodes/PopNode.js
var import_nanoid28 = require("nanoid");
var PopNodeImpl = class extends NodeImpl {
  static create() {
    const baseNode = {
      type: "pop",
      title: "Pop",
      id: (0, import_nanoid28.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {}
    };
    return baseNode;
  }
  getInputDefinitions() {
    return [
      {
        dataType: "any[]",
        id: "array",
        title: "Array"
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        dataType: "any",
        id: "lastItem",
        title: "Last"
      },
      {
        dataType: "any",
        id: "restOfArray",
        title: "Rest"
      }
    ];
  }
  async process(inputs) {
    var _a;
    const inputArray = (_a = inputs["array"]) == null ? void 0 : _a.value;
    if (!Array.isArray(inputArray) || inputArray.length === 0) {
      throw new Error("Input array is empty or not an array");
    }
    const lastItem = inputArray[inputArray.length - 1];
    const rest = inputArray.slice(0, inputArray.length - 1);
    return {
      ["lastItem"]: {
        type: "any",
        value: lastItem
      },
      ["restOfArray"]: {
        type: "any[]",
        value: rest
      }
    };
  }
};
var popNode = nodeDefinition(PopNodeImpl, "Pop");

// ../core/dist/model/nodes/SetGlobalNode.js
var import_nanoid29 = require("nanoid");
var SetGlobalNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "setGlobal",
      title: "Set Global",
      id: (0, import_nanoid29.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {
        id: "variable-name",
        dataType: "string",
        useIdInput: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    const inputs = [
      {
        id: "value",
        title: "Value",
        dataType: this.chartNode.data.dataType
      }
    ];
    if (this.data.useIdInput) {
      inputs.push({
        id: "id",
        title: "Variable ID",
        dataType: "string"
      });
    }
    return inputs;
  }
  getOutputDefinitions() {
    return [
      {
        id: "saved-value",
        title: "Value",
        dataType: this.data.dataType
      },
      {
        id: "previous-value",
        title: "Previous Value",
        dataType: this.data.dataType
      }
    ];
  }
  async process(inputs, context) {
    const rawValue = inputs["value"];
    if (!rawValue) {
      return {};
    }
    const id = this.data.useIdInput ? coerceType(inputs["id"], "string") : this.data.id;
    if (!id) {
      throw new Error("Missing variable ID");
    }
    let previousValue = context.getGlobal(this.data.id);
    if (!previousValue && isArrayDataType(this.data.dataType)) {
      previousValue = { type: this.data.dataType, value: [] };
    } else if (!previousValue && isScalarDataType(this.data.dataType)) {
      previousValue = { type: this.data.dataType, value: scalarDefaults[this.data.dataType] };
    }
    const value = unwrapDataValue(rawValue);
    context.setGlobal(id, value);
    return {
      ["saved-value"]: value,
      ["previous-value"]: previousValue
    };
  }
};
var setGlobalNode = nodeDefinition(SetGlobalNodeImpl, "Set Global");

// ../core/dist/model/nodes/GetGlobalNode.js
var import_nanoid30 = require("nanoid");
var GetGlobalNodeImpl = class extends NodeImpl {
  static create(id = "variable-name") {
    const chartNode = {
      type: "getGlobal",
      title: "Get Global",
      id: (0, import_nanoid30.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 200
      },
      data: {
        id,
        dataType: "string",
        onDemand: true,
        useIdInput: false,
        wait: false
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    if (this.data.useIdInput) {
      return [
        {
          id: "id",
          title: "Variable ID",
          dataType: this.data.dataType
        }
      ];
    }
    return [];
  }
  getOutputDefinitions() {
    const { onDemand, dataType } = this.chartNode.data;
    return [
      {
        id: "value",
        title: "Value",
        dataType: onDemand ? `fn<${dataType}>` : dataType
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "Variable ID",
        dataKey: "id",
        useInputToggleDataKey: "useIdInput"
      },
      {
        type: "dataTypeSelector",
        label: "Data Type",
        dataKey: "dataType"
      },
      {
        type: "toggle",
        label: "On Demand",
        dataKey: "onDemand"
      },
      {
        type: "toggle",
        label: "Wait",
        dataKey: "wait"
      }
    ];
  }
  async process(inputs, context) {
    if (this.data.onDemand) {
      if (this.data.wait) {
        throw new Error("Cannot use onDemand and wait together");
      }
      return {
        ["value"]: {
          type: `fn<${this.data.dataType}>`,
          value: () => {
            const id2 = this.data.useIdInput ? coerceType(inputs["id"], "string") : this.data.id;
            const value2 = context.getGlobal(id2);
            if (value2) {
              return value2.value;
            }
            if (isArrayDataType(this.data.dataType)) {
              return [];
            }
            return scalarDefaults[this.data.dataType];
          }
        }
      };
    }
    const id = this.data.useIdInput ? coerceType(inputs["id"], "string") : this.data.id;
    let value = this.data.wait ? await context.waitForGlobal(id) : context.getGlobal(id);
    if (!value && isArrayDataType(this.data.dataType)) {
      value = { type: this.data.dataType, value: [] };
    }
    if (!value && isScalarDataType(this.data.dataType)) {
      value = { type: this.data.dataType, value: scalarDefaults[this.data.dataType] };
    }
    return {
      ["value"]: value
    };
  }
};
var getGlobalNode = nodeDefinition(GetGlobalNodeImpl, "Get Global");

// ../core/dist/model/nodes/WaitForEventNode.js
var import_nanoid31 = require("nanoid");
var WaitForEventNodeImpl = class extends NodeImpl {
  static create() {
    return {
      id: (0, import_nanoid31.nanoid)(),
      type: "waitForEvent",
      title: "Wait For Event",
      visualData: { x: 0, y: 0, width: 150 },
      data: {
        eventName: "continue",
        useEventNameInput: false
      }
    };
  }
  getInputDefinitions() {
    const inputDefinitions = [];
    if (this.chartNode.data.useEventNameInput) {
      inputDefinitions.push({
        id: "eventName",
        title: "Event Name",
        dataType: "string"
      });
    }
    inputDefinitions.push({
      id: "inputData",
      title: "Data",
      dataType: "any"
    });
    return inputDefinitions;
  }
  getOutputDefinitions() {
    return [
      {
        id: "outputData",
        title: "Data",
        dataType: "any"
      },
      {
        id: "eventData",
        title: "Event Data",
        dataType: "any"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "Event Name",
        dataKey: "eventName",
        useInputToggleDataKey: "useEventNameInput"
      }
    ];
  }
  async process(inputs, context) {
    const eventName = this.chartNode.data.useEventNameInput ? coerceType(inputs["eventName"], "string") : this.chartNode.data.eventName;
    const eventData = await context.waitEvent(eventName);
    return {
      ["outputData"]: inputs["inputData"],
      ["eventData"]: eventData
    };
  }
};
var waitForEventNode = nodeDefinition(WaitForEventNodeImpl, "Wait For Event");

// ../core/dist/model/nodes/ToolNode.js
var import_nanoid32 = require("nanoid");
var ToolNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "tool",
      title: "Tool",
      id: (0, import_nanoid32.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 250
      },
      data: {
        name: "newTool",
        description: "No description provided",
        schema: `{
  "type": "object",
  "properties": {}
}`
      }
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [];
  }
  getOutputDefinitions() {
    return [
      {
        id: "tool",
        title: "Tool",
        dataType: "gpt-tool"
      }
    ];
  }
  getEditors() {
    return [
      {
        type: "string",
        label: "Name",
        dataKey: "name"
      },
      {
        type: "string",
        label: "Description",
        dataKey: "description"
      },
      {
        type: "string",
        label: "Namespace",
        dataKey: "namespace"
      },
      {
        type: "code",
        label: "Schema",
        dataKey: "schema",
        language: "json"
      }
    ];
  }
  async process(inputs) {
    const parsedSchema = JSON.parse(this.data.schema);
    return {
      ["tool"]: {
        type: "gpt-tool",
        value: {
          name: this.data.name,
          description: this.data.description,
          namespace: this.data.namespace,
          schema: parsedSchema
        }
      }
    };
  }
};
var toolNode = nodeDefinition(ToolNodeImpl, "Tool");

// ../core/dist/model/nodes/ToYamlNode.js
var import_nanoid33 = require("nanoid");
var import_yaml2 = __toESM(require("yaml"));
var ToYamlNodeImpl = class extends NodeImpl {
  static create() {
    const chartNode = {
      type: "toYaml",
      title: "To YAML",
      id: (0, import_nanoid33.nanoid)(),
      visualData: {
        x: 0,
        y: 0,
        width: 175
      },
      data: {}
    };
    return chartNode;
  }
  getInputDefinitions() {
    return [
      {
        id: "object",
        title: "Object",
        dataType: "object",
        required: true
      }
    ];
  }
  getOutputDefinitions() {
    return [
      {
        id: "yaml",
        title: "YAML",
        dataType: "string"
      }
    ];
  }
  async process(inputs) {
    const object = coerceType(inputs["object"], "object");
    const toYaml = import_yaml2.default.stringify(object, null, {
      indent: 2
    });
    return {
      ["yaml"]: {
        type: "string",
        value: toYaml
      }
    };
  }
};
var toYamlNode = nodeDefinition(ToYamlNodeImpl, "To YAML");

// ../core/dist/model/Nodes.js
var register = new NodeRegistration().register(toYamlNode).register(userInputNode).register(textNode).register(chatNode).register(promptNode).register(extractRegexNode).register(codeNode).register(matchNode).register(ifNode).register(readDirectoryNode).register(readFileNode).register(ifElseNode).register(chunkNode).register(graphInputNode).register(graphOutputNode).register(subGraphNode).register(arrayNode).register(extractJsonNode).register(assemblePromptNode).register(loopControllerNode).register(trimChatMessagesNode).register(extractYamlNode).register(externalCallNode).register(extractObjectPathNode).register(raiseEventNode).register(contextNode).register(coalesceNode).register(passthroughNode).register(popNode).register(setGlobalNode).register(getGlobalNode).register(waitForEventNode).register(toolNode);
var createNodeInstance = (node) => {
  return register.createImpl(node);
};
function createUnknownNodeInstance(node) {
  return createNodeInstance(node);
}
function nodeFactory(type) {
  return register.create(type);
}
function getNodeDisplayName(type) {
  return register.getDisplayName(type);
}

// ../core/dist/model/GraphProcessor.js
var import_p_queue = __toESM(require("p-queue"));

// ../../.yarn/cache/emittery-npm-1.0.1-3e4e6ba9b5-d95faee6ff.zip/node_modules/emittery/maps.js
var anyMap = /* @__PURE__ */ new WeakMap();
var eventsMap = /* @__PURE__ */ new WeakMap();
var producersMap = /* @__PURE__ */ new WeakMap();

// ../../.yarn/cache/emittery-npm-1.0.1-3e4e6ba9b5-d95faee6ff.zip/node_modules/emittery/index.js
var anyProducer = Symbol("anyProducer");
var resolvedPromise = Promise.resolve();
var listenerAdded = Symbol("listenerAdded");
var listenerRemoved = Symbol("listenerRemoved");
var canEmitMetaEvents = false;
var isGlobalDebugEnabled = false;
function assertEventName(eventName) {
  if (typeof eventName !== "string" && typeof eventName !== "symbol" && typeof eventName !== "number") {
    throw new TypeError("`eventName` must be a string, symbol, or number");
  }
}
function assertListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError("listener must be a function");
  }
}
function getListeners(instance, eventName) {
  const events = eventsMap.get(instance);
  if (!events.has(eventName)) {
    return;
  }
  return events.get(eventName);
}
function getEventProducers(instance, eventName) {
  const key = typeof eventName === "string" || typeof eventName === "symbol" || typeof eventName === "number" ? eventName : anyProducer;
  const producers = producersMap.get(instance);
  if (!producers.has(key)) {
    return;
  }
  return producers.get(key);
}
function enqueueProducers(instance, eventName, eventData) {
  const producers = producersMap.get(instance);
  if (producers.has(eventName)) {
    for (const producer of producers.get(eventName)) {
      producer.enqueue(eventData);
    }
  }
  if (producers.has(anyProducer)) {
    const item = Promise.all([eventName, eventData]);
    for (const producer of producers.get(anyProducer)) {
      producer.enqueue(item);
    }
  }
}
function iterator(instance, eventNames) {
  eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
  let isFinished = false;
  let flush = () => {
  };
  let queue = [];
  const producer = {
    enqueue(item) {
      queue.push(item);
      flush();
    },
    finish() {
      isFinished = true;
      flush();
    }
  };
  for (const eventName of eventNames) {
    let set = getEventProducers(instance, eventName);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      const producers = producersMap.get(instance);
      producers.set(eventName, set);
    }
    set.add(producer);
  }
  return {
    async next() {
      if (!queue) {
        return { done: true };
      }
      if (queue.length === 0) {
        if (isFinished) {
          queue = void 0;
          return this.next();
        }
        await new Promise((resolve) => {
          flush = resolve;
        });
        return this.next();
      }
      return {
        done: false,
        value: await queue.shift()
      };
    },
    async return(value) {
      queue = void 0;
      for (const eventName of eventNames) {
        const set = getEventProducers(instance, eventName);
        if (set) {
          set.delete(producer);
          if (set.size === 0) {
            const producers = producersMap.get(instance);
            producers.delete(eventName);
          }
        }
      }
      flush();
      return arguments.length > 0 ? { done: true, value: await value } : { done: true };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
function defaultMethodNamesOrAssert(methodNames) {
  if (methodNames === void 0) {
    return allEmitteryMethods;
  }
  if (!Array.isArray(methodNames)) {
    throw new TypeError("`methodNames` must be an array of strings");
  }
  for (const methodName of methodNames) {
    if (!allEmitteryMethods.includes(methodName)) {
      if (typeof methodName !== "string") {
        throw new TypeError("`methodNames` element must be a string");
      }
      throw new Error(`${methodName} is not Emittery method`);
    }
  }
  return methodNames;
}
var isMetaEvent = (eventName) => eventName === listenerAdded || eventName === listenerRemoved;
function emitMetaEvent(emitter, eventName, eventData) {
  if (isMetaEvent(eventName)) {
    try {
      canEmitMetaEvents = true;
      emitter.emit(eventName, eventData);
    } finally {
      canEmitMetaEvents = false;
    }
  }
}
var Emittery = class {
  static mixin(emitteryPropertyName, methodNames) {
    methodNames = defaultMethodNamesOrAssert(methodNames);
    return (target) => {
      if (typeof target !== "function") {
        throw new TypeError("`target` must be function");
      }
      for (const methodName of methodNames) {
        if (target.prototype[methodName] !== void 0) {
          throw new Error(`The property \`${methodName}\` already exists on \`target\``);
        }
      }
      function getEmitteryProperty() {
        Object.defineProperty(this, emitteryPropertyName, {
          enumerable: false,
          value: new Emittery()
        });
        return this[emitteryPropertyName];
      }
      Object.defineProperty(target.prototype, emitteryPropertyName, {
        enumerable: false,
        get: getEmitteryProperty
      });
      const emitteryMethodCaller = (methodName) => function(...args) {
        return this[emitteryPropertyName][methodName](...args);
      };
      for (const methodName of methodNames) {
        Object.defineProperty(target.prototype, methodName, {
          enumerable: false,
          value: emitteryMethodCaller(methodName)
        });
      }
      return target;
    };
  }
  static get isDebugEnabled() {
    var _a;
    if (typeof ((_a = globalThis.process) == null ? void 0 : _a.env) !== "object") {
      return isGlobalDebugEnabled;
    }
    const { env } = globalThis.process ?? { env: {} };
    return env.DEBUG === "emittery" || env.DEBUG === "*" || isGlobalDebugEnabled;
  }
  static set isDebugEnabled(newValue) {
    isGlobalDebugEnabled = newValue;
  }
  constructor(options = {}) {
    anyMap.set(this, /* @__PURE__ */ new Set());
    eventsMap.set(this, /* @__PURE__ */ new Map());
    producersMap.set(this, /* @__PURE__ */ new Map());
    producersMap.get(this).set(anyProducer, /* @__PURE__ */ new Set());
    this.debug = options.debug ?? {};
    if (this.debug.enabled === void 0) {
      this.debug.enabled = false;
    }
    if (!this.debug.logger) {
      this.debug.logger = (type, debugName, eventName, eventData) => {
        try {
          eventData = JSON.stringify(eventData);
        } catch {
          eventData = `Object with the following keys failed to stringify: ${Object.keys(eventData).join(",")}`;
        }
        if (typeof eventName === "symbol" || typeof eventName === "number") {
          eventName = eventName.toString();
        }
        const currentTime = /* @__PURE__ */ new Date();
        const logTime = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}.${currentTime.getMilliseconds()}`;
        console.log(`[${logTime}][emittery:${type}][${debugName}] Event Name: ${eventName}
	data: ${eventData}`);
      };
    }
  }
  logIfDebugEnabled(type, eventName, eventData) {
    if (Emittery.isDebugEnabled || this.debug.enabled) {
      this.debug.logger(type, this.debug.name, eventName, eventData);
    }
  }
  on(eventNames, listener) {
    assertListener(listener);
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      assertEventName(eventName);
      let set = getListeners(this, eventName);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        const events = eventsMap.get(this);
        events.set(eventName, set);
      }
      set.add(listener);
      this.logIfDebugEnabled("subscribe", eventName, void 0);
      if (!isMetaEvent(eventName)) {
        emitMetaEvent(this, listenerAdded, { eventName, listener });
      }
    }
    return this.off.bind(this, eventNames, listener);
  }
  off(eventNames, listener) {
    assertListener(listener);
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      assertEventName(eventName);
      const set = getListeners(this, eventName);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          const events = eventsMap.get(this);
          events.delete(eventName);
        }
      }
      this.logIfDebugEnabled("unsubscribe", eventName, void 0);
      if (!isMetaEvent(eventName)) {
        emitMetaEvent(this, listenerRemoved, { eventName, listener });
      }
    }
  }
  once(eventNames) {
    let off_;
    const promise = new Promise((resolve) => {
      off_ = this.on(eventNames, (data) => {
        off_();
        resolve(data);
      });
    });
    promise.off = off_;
    return promise;
  }
  events(eventNames) {
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      assertEventName(eventName);
    }
    return iterator(this, eventNames);
  }
  async emit(eventName, eventData) {
    assertEventName(eventName);
    if (isMetaEvent(eventName) && !canEmitMetaEvents) {
      throw new TypeError("`eventName` cannot be meta event `listenerAdded` or `listenerRemoved`");
    }
    this.logIfDebugEnabled("emit", eventName, eventData);
    enqueueProducers(this, eventName, eventData);
    const listeners = getListeners(this, eventName) ?? /* @__PURE__ */ new Set();
    const anyListeners = anyMap.get(this);
    const staticListeners = [...listeners];
    const staticAnyListeners = isMetaEvent(eventName) ? [] : [...anyListeners];
    await resolvedPromise;
    await Promise.all([
      ...staticListeners.map(async (listener) => {
        if (listeners.has(listener)) {
          return listener(eventData);
        }
      }),
      ...staticAnyListeners.map(async (listener) => {
        if (anyListeners.has(listener)) {
          return listener(eventName, eventData);
        }
      })
    ]);
  }
  async emitSerial(eventName, eventData) {
    assertEventName(eventName);
    if (isMetaEvent(eventName) && !canEmitMetaEvents) {
      throw new TypeError("`eventName` cannot be meta event `listenerAdded` or `listenerRemoved`");
    }
    this.logIfDebugEnabled("emitSerial", eventName, eventData);
    const listeners = getListeners(this, eventName) ?? /* @__PURE__ */ new Set();
    const anyListeners = anyMap.get(this);
    const staticListeners = [...listeners];
    const staticAnyListeners = [...anyListeners];
    await resolvedPromise;
    for (const listener of staticListeners) {
      if (listeners.has(listener)) {
        await listener(eventData);
      }
    }
    for (const listener of staticAnyListeners) {
      if (anyListeners.has(listener)) {
        await listener(eventName, eventData);
      }
    }
  }
  onAny(listener) {
    assertListener(listener);
    this.logIfDebugEnabled("subscribeAny", void 0, void 0);
    anyMap.get(this).add(listener);
    emitMetaEvent(this, listenerAdded, { listener });
    return this.offAny.bind(this, listener);
  }
  anyEvent() {
    return iterator(this);
  }
  offAny(listener) {
    assertListener(listener);
    this.logIfDebugEnabled("unsubscribeAny", void 0, void 0);
    emitMetaEvent(this, listenerRemoved, { listener });
    anyMap.get(this).delete(listener);
  }
  clearListeners(eventNames) {
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    for (const eventName of eventNames) {
      this.logIfDebugEnabled("clear", eventName, void 0);
      if (typeof eventName === "string" || typeof eventName === "symbol" || typeof eventName === "number") {
        const set = getListeners(this, eventName);
        if (set) {
          set.clear();
        }
        const producers = getEventProducers(this, eventName);
        if (producers) {
          for (const producer of producers) {
            producer.finish();
          }
          producers.clear();
        }
      } else {
        anyMap.get(this).clear();
        for (const [eventName2, listeners] of eventsMap.get(this).entries()) {
          listeners.clear();
          eventsMap.get(this).delete(eventName2);
        }
        for (const [eventName2, producers] of producersMap.get(this).entries()) {
          for (const producer of producers) {
            producer.finish();
          }
          producers.clear();
          producersMap.get(this).delete(eventName2);
        }
      }
    }
  }
  listenerCount(eventNames) {
    var _a, _b, _c;
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    let count = 0;
    for (const eventName of eventNames) {
      if (typeof eventName === "string") {
        count += anyMap.get(this).size + (((_a = getListeners(this, eventName)) == null ? void 0 : _a.size) ?? 0) + (((_b = getEventProducers(this, eventName)) == null ? void 0 : _b.size) ?? 0) + (((_c = getEventProducers(this)) == null ? void 0 : _c.size) ?? 0);
        continue;
      }
      if (typeof eventName !== "undefined") {
        assertEventName(eventName);
      }
      count += anyMap.get(this).size;
      for (const value of eventsMap.get(this).values()) {
        count += value.size;
      }
      for (const value of producersMap.get(this).values()) {
        count += value.size;
      }
    }
    return count;
  }
  bindMethods(target, methodNames) {
    if (typeof target !== "object" || target === null) {
      throw new TypeError("`target` must be an object");
    }
    methodNames = defaultMethodNamesOrAssert(methodNames);
    for (const methodName of methodNames) {
      if (target[methodName] !== void 0) {
        throw new Error(`The property \`${methodName}\` already exists on \`target\``);
      }
      Object.defineProperty(target, methodName, {
        enumerable: false,
        value: this[methodName].bind(this)
      });
    }
  }
};
var allEmitteryMethods = Object.getOwnPropertyNames(Emittery.prototype).filter((v) => v !== "constructor");
Object.defineProperty(Emittery, "listenerAdded", {
  value: listenerAdded,
  writable: false,
  enumerable: true,
  configurable: false
});
Object.defineProperty(Emittery, "listenerRemoved", {
  value: listenerRemoved,
  writable: false,
  enumerable: true,
  configurable: false
});

// ../core/dist/model/GraphProcessor.js
var import_nanoid34 = require("nanoid");
var GraphProcessor = class {
  // Per-instance state
  #graph;
  #project;
  #nodesById;
  #nodeInstances;
  #connections;
  #definitions;
  #emitter = new Emittery();
  #running = false;
  #isSubProcessor = false;
  #scc;
  #nodesNotInCycle;
  #externalFunctions = {};
  slowMode = false;
  #isPaused = false;
  #parent;
  id = (0, import_nanoid34.nanoid)();
  // Per-process state
  #erroredNodes = void 0;
  #remainingNodes = void 0;
  #visitedNodes = void 0;
  #currentlyProcessing = void 0;
  #context = void 0;
  #nodeResults = void 0;
  #abortController = void 0;
  #processingQueue = void 0;
  #graphInputs = void 0;
  #graphOutputs = void 0;
  #executionCache = void 0;
  #queuedNodes = void 0;
  #loopControllersSeen = void 0;
  #subprocessors = void 0;
  #contextValues = void 0;
  #globals = void 0;
  #loopInfoForNode = void 0;
  /** User input nodes that are pending user input. */
  #pendingUserInputs = void 0;
  get isRunning() {
    return this.#running;
  }
  constructor(project, graphId) {
    this.#project = project;
    const graph = project.graphs[graphId];
    if (!graph) {
      throw new Error(`Graph ${graphId} not found in project`);
    }
    this.#graph = graph;
    this.#nodeInstances = {};
    this.#connections = {};
    this.#nodesById = {};
    this.#emitter.bindMethods(this, ["on", "off", "once", "onAny", "offAny"]);
    for (const node of this.#graph.nodes) {
      this.#nodeInstances[node.id] = createUnknownNodeInstance(node);
      this.#nodesById[node.id] = node;
    }
    for (const conn of this.#graph.connections) {
      if (!this.#connections[conn.inputNodeId]) {
        this.#connections[conn.inputNodeId] = [];
      }
      if (!this.#connections[conn.outputNodeId]) {
        this.#connections[conn.outputNodeId] = [];
      }
      this.#connections[conn.inputNodeId].push(conn);
      this.#connections[conn.outputNodeId].push(conn);
    }
    this.#definitions = {};
    for (const node of this.#graph.nodes) {
      this.#definitions[node.id] = {
        inputs: this.#nodeInstances[node.id].getInputDefinitions(this.#connections[node.id] ?? [], this.#nodesById, this.#project),
        outputs: this.#nodeInstances[node.id].getOutputDefinitions(this.#connections[node.id] ?? [], this.#nodesById, this.#project)
      };
    }
    this.#scc = this.#tarjanSCC();
    this.#nodesNotInCycle = this.#scc.filter((cycle) => cycle.length === 1).flat();
    this.setExternalFunction("echo", async (value) => ({ type: "any", value }));
    this.#emitter.on("globalSet", ({ id, value }) => {
      this.#emitter.emit(`globalSet:${id}`, value);
    });
  }
  on = void 0;
  off = void 0;
  once = void 0;
  onAny = void 0;
  offAny = void 0;
  #onUserEventHandlers = /* @__PURE__ */ new Map();
  onUserEvent(onEvent, listener) {
    const handler = (event, value) => {
      if (event === `userEvent:${onEvent}`) {
        listener(value);
      }
    };
    this.#onUserEventHandlers.set(listener, handler);
    this.#emitter.onAny(handler);
  }
  offUserEvent(listener) {
    const internalHandler = this.#onUserEventHandlers.get(listener);
    this.#emitter.offAny(internalHandler);
  }
  userInput(nodeId, values2) {
    const pending = this.#pendingUserInputs[nodeId];
    if (pending) {
      pending.resolve(values2);
      delete this.#pendingUserInputs[nodeId];
    }
    for (const processor of this.#subprocessors) {
      processor.userInput(nodeId, values2);
    }
  }
  setExternalFunction(name, fn) {
    this.#externalFunctions[name] = fn;
  }
  async abort() {
    if (!this.#running) {
      return Promise.resolve();
    }
    this.#abortController.abort();
    this.#emitter.emit("abort", void 0);
    await this.#processingQueue.onIdle();
  }
  pause() {
    if (this.#isPaused === false) {
      this.#isPaused = true;
      this.#emitter.emit("pause", void 0);
    }
  }
  resume() {
    if (this.#isPaused) {
      this.#isPaused = false;
      this.#emitter.emit("resume", void 0);
    }
  }
  setSlowMode(slowMode) {
    this.slowMode = slowMode;
  }
  async #waitUntilUnpaused() {
    if (!this.#isPaused) {
      return;
    }
    await this.#emitter.once("resume");
  }
  /** Main function for running a graph. Runs a graph and returns the outputs from the output nodes of the graph. */
  async processGraph(context, inputs = {}, contextValues = {}) {
    try {
      if (this.#running) {
        throw new Error("Cannot process graph while already processing");
      }
      this.#running = true;
      this.#context = context;
      this.#nodeResults = /* @__PURE__ */ new Map();
      this.#erroredNodes = /* @__PURE__ */ new Map();
      this.#visitedNodes = /* @__PURE__ */ new Set();
      this.#currentlyProcessing = /* @__PURE__ */ new Set();
      this.#remainingNodes = new Set(this.#graph.nodes.map((n) => n.id));
      this.#pendingUserInputs = {};
      this.#abortController = new AbortController();
      this.#processingQueue = new import_p_queue.default({ concurrency: Infinity });
      this.#graphInputs = inputs;
      this.#graphOutputs = {};
      this.#executionCache ??= /* @__PURE__ */ new Map();
      this.#queuedNodes = /* @__PURE__ */ new Set();
      this.#loopControllersSeen = /* @__PURE__ */ new Set();
      this.#subprocessors = /* @__PURE__ */ new Set();
      this.#loopInfoForNode = /* @__PURE__ */ new Map();
      this.#globals ??= /* @__PURE__ */ new Map();
      this.#contextValues ??= contextValues;
      if (!this.#isSubProcessor) {
        this.#emitter.emit("start", void 0);
      }
      this.#emitter.emit("graphStart", { graph: this.#graph, inputs: this.#graphInputs });
      const nodesWithoutOutputs = this.#graph.nodes.filter((node) => this.#outputNodesFrom(node).length === 0);
      await this.#waitUntilUnpaused();
      for (const nodeWithoutOutputs of nodesWithoutOutputs) {
        this.#processingQueue.add(async () => {
          await this.#fetchNodeDataAndProcessNode(nodeWithoutOutputs);
        });
      }
      await this.#processingQueue.onIdle();
      if (this.#erroredNodes.size > 0) {
        const error = Error(`Graph ${this.#graph.metadata.name} (${this.#graph.metadata.id}) failed to process due to errors in nodes: ${Array.from(this.#erroredNodes).map(([nodeId, error2]) => `${this.#nodesById[nodeId].title} (${nodeId}): ${error2}`).join(", ")}`);
        this.#emitter.emit("graphError", { graph: this.#graph, error });
        if (!this.#isSubProcessor) {
          this.#emitter.emit("error", { error });
        }
        throw error;
      }
      const outputValues = this.#graphOutputs;
      this.#running = false;
      this.#emitter.emit("graphFinish", { graph: this.#graph, outputs: outputValues });
      if (!this.#isSubProcessor) {
        this.#emitter.emit("done", { results: outputValues });
      }
      return outputValues;
    } finally {
      this.#running = false;
    }
  }
  async #fetchNodeDataAndProcessNode(node) {
    if (this.#currentlyProcessing.has(node.id) || this.#queuedNodes.has(node.id)) {
      return;
    }
    if (this.#nodeResults.has(node.id) || this.#erroredNodes.has(node.id)) {
      return;
    }
    const inputNodes = this.#inputNodesTo(node);
    for (const inputNode of inputNodes) {
      if (this.#erroredNodes.has(inputNode.id)) {
        return;
      }
    }
    const connections = this.#connections[node.id] ?? [];
    const inputsReady = this.#definitions[node.id].inputs.every((input) => {
      const connectionToInput = connections == null ? void 0 : connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      return connectionToInput || !input.required;
    });
    if (!inputsReady) {
      return;
    }
    this.#emitter.emit("trace", `Node ${node.title} has required inputs nodes: ${inputNodes.map((n) => n.title).join(", ")}`);
    this.#queuedNodes.add(node.id);
    this.#processingQueue.addAll(inputNodes.map((inputNode) => {
      return async () => {
        this.#emitter.emit("trace", `Fetching required data for node ${inputNode.title} (${inputNode.id})`);
        await this.#fetchNodeDataAndProcessNode(inputNode);
      };
    }));
    await this.#processNodeIfAllInputsAvailable(node);
  }
  /** If all inputs are present, all conditions met, processes the node. */
  async #processNodeIfAllInputsAvailable(node) {
    var _a;
    if (this.#currentlyProcessing.has(node.id)) {
      this.#emitter.emit("trace", `Node ${node.title} is already being processed`);
      return;
    }
    if (this.#visitedNodes.has(node.id) && node.type !== "loopController") {
      this.#emitter.emit("trace", `Node ${node.title} has already been processed`);
      return;
    }
    if (this.#erroredNodes.has(node.id)) {
      this.#emitter.emit("trace", `Node ${node.title} has already errored`);
      return;
    }
    const inputNodes = this.#inputNodesTo(node);
    for (const inputNode of inputNodes) {
      if (this.#erroredNodes.has(inputNode.id)) {
        this.#emitter.emit("trace", `Node ${node.title} has errored input node ${inputNode.title}`);
        return;
      }
    }
    const connections = this.#connections[node.id] ?? [];
    const inputsReady = this.#definitions[node.id].inputs.every((input) => {
      const connectionToInput = connections == null ? void 0 : connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      return connectionToInput || !input.required;
    });
    if (!inputsReady) {
      this.#emitter.emit("trace", `Node ${node.title} has required inputs nodes: ${inputNodes.map((n) => n.title).join(", ")}`);
      return;
    }
    const inputValues = this.#getInputValuesForNode(node);
    if (node.title === "Graph Output") {
      this.#emitter.emit("trace", `Node ${node.title} has input values ${JSON.stringify(inputValues)}`);
    }
    if (this.#excludedDueToControlFlow(node, inputValues, (0, import_nanoid34.nanoid)(), "loop-not-broken")) {
      this.#emitter.emit("trace", `Node ${node.title} is excluded due to control flow`);
      return;
    }
    for (const inputNode of inputNodes) {
      if (node.type === "loopController" && !this.#loopControllersSeen.has(node.id) && this.#nodesAreInSameCycle(node.id, inputNode.id)) {
        continue;
      }
      if (this.#visitedNodes.has(inputNode.id) === false) {
        this.#emitter.emit("trace", `Node ${node.title} is waiting for input node ${inputNode.title}`);
        return;
      }
    }
    this.#currentlyProcessing.add(node.id);
    if (node.type === "loopController") {
      this.#loopControllersSeen.add(node.id);
    }
    const loopInfo = this.#loopInfoForNode.get(node.id);
    if (loopInfo && loopInfo.loopControllerId !== node.id) {
      loopInfo.nodes.add(node.id);
    }
    const processId = await this.#processNode(node);
    if (this.slowMode) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    this.#emitter.emit("trace", `Finished processing node ${node.title} (${node.id})`);
    this.#visitedNodes.add(node.id);
    this.#currentlyProcessing.delete(node.id);
    this.#remainingNodes.delete(node.id);
    const outputNodes = this.#outputNodesFrom(node);
    if (node.type === "loopController") {
      const loopControllerResults = this.#nodeResults.get(node.id);
      const didBreak = ((_a = loopControllerResults["break"]) == null ? void 0 : _a.type) !== "control-flow-excluded";
      this.#emitter.emit("trace", JSON.stringify(this.#nodeResults.get(node.id)));
      if (!didBreak) {
        this.#emitter.emit("trace", `Loop controller ${node.title} did not break, so we're looping again`);
        for (const loopNodeId of (loopInfo == null ? void 0 : loopInfo.nodes) ?? []) {
          const cycleNode = this.#nodesById[loopNodeId];
          this.#emitter.emit("trace", `Clearing cycle node ${cycleNode.title} (${cycleNode.id})`);
          this.#visitedNodes.delete(cycleNode.id);
          this.#currentlyProcessing.delete(cycleNode.id);
          this.#remainingNodes.add(cycleNode.id);
          this.#nodeResults.delete(cycleNode.id);
        }
      }
    }
    let childLoopInfo = loopInfo;
    if (node.type === "loopController") {
      if (childLoopInfo != null && childLoopInfo.loopControllerId !== node.id) {
        this.#nodeErrored(node, new Error("Nested loops are not supported"), processId);
        return;
      }
      childLoopInfo = {
        loopControllerId: node.id,
        // We want to be able to clear every node that _potentially_ could run in the loop
        nodes: (childLoopInfo == null ? void 0 : childLoopInfo.nodes) ?? /* @__PURE__ */ new Set(),
        // TODO loop controller max iterations
        iterationCount: ((childLoopInfo == null ? void 0 : childLoopInfo.iterationCount) ?? 0) + 1
      };
      if (childLoopInfo.iterationCount > (node.data.maxIterations ?? 100)) {
        this.#nodeErrored(node, new Error(`Loop controller ${node.title} has exceeded max iterations of ${node.data.maxIterations ?? 100}`), processId);
        return;
      }
    }
    if (childLoopInfo) {
      for (const outputNode of outputNodes) {
        this.#loopInfoForNode.set(outputNode.id, childLoopInfo);
      }
    }
    this.#processingQueue.addAll(outputNodes.map((outputNode) => async () => {
      this.#emitter.emit("trace", `Trying to run output node from ${node.title}: ${outputNode.title} (${outputNode.id})`);
      await this.#processNodeIfAllInputsAvailable(outputNode);
    }));
  }
  async #processNode(node) {
    const processId = (0, import_nanoid34.nanoid)();
    if (this.#abortController.signal.aborted) {
      this.#nodeErrored(node, new Error("Processing aborted"), processId);
      return processId;
    }
    const inputNodes = this.#inputNodesTo(node);
    const erroredInputNodes = inputNodes.filter((inputNode) => this.#erroredNodes.has(inputNode.id));
    if (erroredInputNodes.length > 0) {
      const error = new Error(`Cannot process node ${node.title} (${node.id}) because it depends on errored nodes: ${erroredInputNodes.map((n) => `${n.title} (${n.id})`).join(", ")}`);
      this.#nodeErrored(node, error, processId);
      return processId;
    }
    if (this.#isNodeOfType("userInput", node)) {
      await this.#processUserInputNode(node, processId);
    } else if (node.isSplitRun) {
      await this.#processSplitRunNode(node, processId);
    } else {
      await this.#processNormalNode(node, processId);
    }
    return processId;
  }
  #isNodeOfType(type, node) {
    return node.type === type;
  }
  async #processUserInputNode(node, processId) {
    try {
      const inputValues = this.#getInputValuesForNode(node);
      if (this.#excludedDueToControlFlow(node, inputValues, processId)) {
        return;
      }
      this.#emitter.emit("nodeStart", { node, inputs: inputValues, processId });
      const results = await new Promise((resolve, reject) => {
        this.#pendingUserInputs[node.id] = {
          resolve,
          reject
        };
        this.#abortController.signal.addEventListener("abort", () => {
          delete this.#pendingUserInputs[node.id];
          reject(new Error("Processing aborted"));
        });
        this.#emitter.emit("userInput", {
          node,
          inputs: inputValues,
          callback: (results2) => {
            resolve(results2);
            delete this.#pendingUserInputs[node.id];
          },
          processId
        });
      });
      const outputValues = this.#nodeInstances[node.id].getOutputValuesFromUserInput(inputValues, results);
      this.#nodeResults.set(node.id, outputValues);
      this.#visitedNodes.add(node.id);
      this.#emitter.emit("nodeFinish", { node, outputs: outputValues, processId });
    } catch (e) {
      this.#nodeErrored(node, e, processId);
    }
  }
  async #processSplitRunNode(node, processId) {
    const inputValues = this.#getInputValuesForNode(node);
    if (this.#excludedDueToControlFlow(node, inputValues, processId)) {
      return;
    }
    const splittingAmount = Math.min(max_default(values(inputValues).map((value) => Array.isArray(value == null ? void 0 : value.value) ? value == null ? void 0 : value.value.length : 1)) ?? 1, node.splitRunMax ?? 10);
    this.#emitter.emit("nodeStart", { node, inputs: inputValues, processId });
    try {
      const results = await Promise.all(range_default(0, splittingAmount).map(async (i) => {
        const inputs = fromEntries(entries(inputValues).map(([port, value]) => [
          port,
          isArrayDataValue(value) ? arrayizeDataValue(value)[i] ?? void 0 : value
        ]));
        try {
          const output = await this.#processNodeWithInputData(node, inputs, i, processId, (node2, partialOutputs, index) => this.#emitter.emit("partialOutput", { node: node2, outputs: partialOutputs, index, processId }));
          return { type: "output", output };
        } catch (error) {
          return { type: "error", error: getError(error) };
        }
      }));
      const errors = results.filter((r) => r.type === "error").map((r) => r.error);
      if (errors.length === 1) {
        const e = errors[0];
        throw e;
      } else if (errors.length > 0) {
        throw new Error(errors.join("\n"));
      }
      const aggregateResults = results.reduce((acc, result) => {
        for (const [portId, value] of entries(result.output)) {
          acc[portId] ??= { type: (value == null ? void 0 : value.type) + "[]", value: [] };
          acc[portId].value.push(value == null ? void 0 : value.value);
        }
        return acc;
      }, {});
      this.#nodeResults.set(node.id, aggregateResults);
      this.#visitedNodes.add(node.id);
      this.#emitter.emit("nodeFinish", { node, outputs: aggregateResults, processId });
    } catch (error) {
      this.#nodeErrored(node, error, processId);
    }
  }
  async #processNormalNode(node, processId) {
    const inputValues = this.#getInputValuesForNode(node);
    if (this.#excludedDueToControlFlow(node, inputValues, processId)) {
      return;
    }
    this.#emitter.emit("nodeStart", { node, inputs: inputValues, processId });
    try {
      const outputValues = await this.#processNodeWithInputData(node, inputValues, 0, processId, (node2, partialOutputs, index) => this.#emitter.emit("partialOutput", { node: node2, outputs: partialOutputs, index, processId }));
      this.#nodeResults.set(node.id, outputValues);
      this.#visitedNodes.add(node.id);
      this.#emitter.emit("nodeFinish", { node, outputs: outputValues, processId });
    } catch (error) {
      this.#nodeErrored(node, error, processId);
    }
  }
  #nodeErrored(node, e, processId) {
    const error = getError(e);
    this.#emitter.emit("nodeError", { node, error, processId });
    this.#emitter.emit("trace", `Node ${node.title} (${node.id}-${processId}) errored: ${error.stack}`);
    this.#erroredNodes.set(node.id, error.toString());
  }
  getRootProcessor() {
    let processor = this;
    while (processor.#parent) {
      processor = processor.#parent;
    }
    return processor;
  }
  async #processNodeWithInputData(node, inputValues, index, processId, partialOutput) {
    const instance = this.#nodeInstances[node.id];
    const context = {
      ...this.#context,
      project: this.#project,
      executionCache: this.#executionCache,
      graphInputs: this.#graphInputs,
      graphOutputs: this.#graphOutputs,
      waitEvent: async (event) => {
        return new Promise((resolve, reject) => {
          this.#emitter.once(`userEvent:${event}`).then(resolve).catch(reject);
          this.#abortController.signal.addEventListener("abort", () => {
            reject(new Error("Process aborted"));
          });
        });
      },
      raiseEvent: (event, data) => {
        this.#emitter.emit(`userEvent:${event}`, data);
      },
      contextValues: this.#contextValues,
      externalFunctions: { ...this.#externalFunctions },
      onPartialOutputs: (partialOutputs) => partialOutput == null ? void 0 : partialOutput(node, partialOutputs, index),
      signal: this.#abortController.signal,
      processId,
      getGlobal: (id) => this.#globals.get(id),
      setGlobal: (id, value) => {
        this.#globals.set(id, value);
        this.#emitter.emit("globalSet", { id, value, processId });
      },
      waitForGlobal: async (id) => {
        if (this.#globals.has(id)) {
          return this.#globals.get(id);
        }
        await this.getRootProcessor().#emitter.once(`globalSet:${id}`);
        return this.#globals.get(id);
      },
      createSubProcessor: (subGraphId) => {
        const processor = new GraphProcessor(this.#project, subGraphId);
        processor.#isSubProcessor = true;
        processor.#executionCache = this.#executionCache;
        processor.#externalFunctions = this.#externalFunctions;
        processor.#contextValues = this.#contextValues;
        processor.#parent = this;
        processor.#globals = this.#globals;
        processor.on("nodeError", (e) => this.#emitter.emit("nodeError", e));
        processor.on("nodeFinish", (e) => this.#emitter.emit("nodeFinish", e));
        processor.on("partialOutput", (e) => this.#emitter.emit("partialOutput", e));
        processor.on("nodeExcluded", (e) => this.#emitter.emit("nodeExcluded", e));
        processor.on("nodeStart", (e) => this.#emitter.emit("nodeStart", e));
        processor.on("userInput", (e) => this.#emitter.emit("userInput", e));
        processor.on("graphStart", (e) => this.#emitter.emit("graphStart", e));
        processor.on("graphFinish", (e) => this.#emitter.emit("graphFinish", e));
        processor.on("globalSet", (e) => this.#emitter.emit("globalSet", e));
        processor.on("pause", (e) => {
          if (!this.#isPaused) {
            this.pause();
          }
        });
        processor.on("resume", (e) => {
          if (this.#isPaused) {
            this.resume();
          }
        });
        processor.onAny((event, data) => {
          if (event.startsWith("userEvent:")) {
            this.#emitter.emit(event, data);
          } else if (event.startsWith("globalSet:")) {
            this.#emitter.emit(event, data);
          }
        });
        this.#subprocessors.add(processor);
        this.on("abort", () => processor.abort());
        this.on("pause", () => processor.pause());
        this.on("resume", () => processor.resume());
        return processor;
      },
      trace: (message) => {
        this.#emitter.emit("trace", message);
      }
    };
    await this.#waitUntilUnpaused();
    const results = await instance.process(inputValues, context);
    if (this.#abortController.signal.aborted) {
      throw new Error("Aborted");
    }
    return results;
  }
  #excludedDueToControlFlow(node, inputValues, processId, typeOfExclusion = void 0) {
    var _a;
    const inputValuesList = values(inputValues);
    const controlFlowExcludedValues = inputValuesList.filter((value) => value && getScalarTypeOf(value.type) === "control-flow-excluded" && (!typeOfExclusion || value.value === typeOfExclusion));
    const inputIsExcludedValue = inputValuesList.length > 0 && controlFlowExcludedValues.length > 0;
    const inputConnections = ((_a = this.#connections[node.id]) == null ? void 0 : _a.filter((conn) => conn.inputNodeId === node.id)) ?? [];
    const outputNodes = inputConnections.map((conn) => this.#graph.nodes.find((n) => n.id === conn.outputNodeId)).filter((n) => n);
    const anyOutputIsExcludedValue = outputNodes.length > 0 && outputNodes.some((outputNode) => {
      const outputValues = this.#nodeResults.get(outputNode.id) ?? {};
      const outputControlFlowExcluded = outputValues[ControlFlowExcluded];
      if (outputControlFlowExcluded && (!typeOfExclusion || outputControlFlowExcluded.value === typeOfExclusion)) {
        return true;
      }
      return false;
    });
    const isWaitingForLoop = controlFlowExcludedValues.some((value) => (value == null ? void 0 : value.value) === "loop-not-broken");
    const nodesAllowedToConsumeExcludedValue = ["if", "ifElse", "coalesce", "graphOutput"];
    const allowedToConsumedExcludedValue = nodesAllowedToConsumeExcludedValue.includes(node.type) && !isWaitingForLoop;
    if ((inputIsExcludedValue || anyOutputIsExcludedValue) && !allowedToConsumedExcludedValue) {
      if (!isWaitingForLoop) {
        this.#emitter.emit("trace", `Excluding node ${node.title} because of control flow.`);
        this.#emitter.emit("nodeExcluded", { node, processId });
        this.#visitedNodes.add(node.id);
        this.#nodeResults.set(node.id, {
          [ControlFlowExcluded]: { type: "control-flow-excluded", value: void 0 }
        });
      }
      return true;
    }
    return false;
  }
  #getInputValuesForNode(node) {
    const connections = this.#connections[node.id];
    return this.#definitions[node.id].inputs.reduce((values2, input) => {
      if (!connections) {
        return values2;
      }
      const connection = connections.find((conn) => conn.inputId === input.id && conn.inputNodeId === node.id);
      if (connection) {
        const outputNode = this.#nodeInstances[connection.outputNodeId].chartNode;
        const outputNodeOutputs = this.#nodeResults.get(outputNode.id);
        const outputResult = outputNodeOutputs == null ? void 0 : outputNodeOutputs[connection.outputId];
        values2[input.id] = outputResult;
        if (outputNodeOutputs == null ? void 0 : outputNodeOutputs[ControlFlowExcludedPort]) {
          values2[ControlFlowExcludedPort] = {
            type: "control-flow-excluded",
            value: void 0
          };
        }
      }
      return values2;
    }, {});
  }
  /** Gets the nodes that are inputting to the given node. */
  #inputNodesTo(node) {
    var _a;
    const connections = this.#connections[node.id];
    if (!connections) {
      return [];
    }
    const connectionsToNode = connections.filter((conn) => conn.inputNodeId === node.id).filter(isNotNull);
    const inputDefinitions = ((_a = this.#definitions[node.id]) == null ? void 0 : _a.inputs) ?? [];
    return connectionsToNode.filter((connection) => {
      const connectionDefinition = inputDefinitions.find((def) => def.id === connection.inputId);
      return connectionDefinition != null;
    }).map((conn) => this.#nodesById[conn.outputNodeId]).filter(isNotNull);
  }
  /** Gets the nodes that the given node it outputting to. */
  #outputNodesFrom(node) {
    var _a;
    const connections = this.#connections[node.id];
    if (!connections) {
      return [];
    }
    const connectionsToNode = connections.filter((conn) => conn.outputNodeId === node.id);
    const outputDefinitions = ((_a = this.#definitions[node.id]) == null ? void 0 : _a.outputs) ?? [];
    return connectionsToNode.filter((connection) => {
      const connectionDefinition = outputDefinitions.find((def) => def.id === connection.outputId);
      return connectionDefinition != null;
    }).map((conn) => this.#nodesById[conn.inputNodeId]).filter(isNotNull);
  }
  #tarjanSCC() {
    let index = 0;
    const stack = [];
    const indices = /* @__PURE__ */ new Map();
    const lowLinks = /* @__PURE__ */ new Map();
    const onStack = /* @__PURE__ */ new Map();
    const sccs = [];
    const strongConnect = (node) => {
      indices.set(node.id, index);
      lowLinks.set(node.id, index);
      index++;
      stack.push(node);
      onStack.set(node.id, true);
      const connections = this.#connections[node.id];
      connections == null ? void 0 : connections.forEach((conn) => {
        const successor = this.#nodesById[conn.outputNodeId];
        if (!indices.has(successor.id)) {
          strongConnect(successor);
          lowLinks.set(node.id, Math.min(lowLinks.get(node.id), lowLinks.get(successor.id)));
        } else if (onStack.get(successor.id)) {
          lowLinks.set(node.id, Math.min(lowLinks.get(node.id), indices.get(successor.id)));
        }
      });
      if (lowLinks.get(node.id) === indices.get(node.id)) {
        const scc = [];
        let connectedNode;
        do {
          connectedNode = stack.pop();
          onStack.set(connectedNode.id, false);
          scc.push(connectedNode);
        } while (connectedNode.id !== node.id);
        sccs.push(scc);
      }
    };
    for (const node of this.#graph.nodes) {
      if (!indices.has(node.id)) {
        strongConnect(node);
      }
    }
    return sccs;
  }
  #nodeIsInCycle(nodeId) {
    return this.#nodesNotInCycle.find((node) => node.id === nodeId) == null;
  }
  #nodesAreInSameCycle(a, b) {
    return this.#scc.find((cycle) => cycle.find((node) => node.id === a) && cycle.find((node) => node.id === b));
  }
};

// ../core/dist/model/NodeGraph.js
var import_nanoid35 = require("nanoid");
function emptyNodeGraph() {
  return {
    nodes: [],
    connections: [],
    metadata: {
      id: (0, import_nanoid35.nanoid)(),
      name: "Untitled Graph",
      description: ""
    }
  };
}

// ../core/dist/model/native/BaseDir.js
var baseDirs = {
  app: "app",
  appCache: "appCache",
  appConfig: "appConfig",
  appData: "appData",
  appLocalData: "appLocalData",
  appLog: "appLog",
  audio: "audio",
  cache: "cache",
  config: "config",
  data: "data",
  desktop: "desktop",
  document: "document",
  download: "download",
  executable: "executable",
  font: "font",
  home: "home",
  localData: "localData",
  log: "log",
  picture: "picture",
  public: "public",
  resource: "resource",
  runtime: "runtime",
  temp: "temp",
  template: "template",
  video: "video"
};
function assertBaseDir(baseDir) {
  if (!(baseDir in baseDirs)) {
    throw new Error(`Invalid base directory: ${baseDir}`);
  }
}

// ../core/dist/model/native/BrowserNativeApi.js
var BrowserNativeApi = class {
  readdir(_path, _baseDir) {
    throw new Error("Method not implemented.");
  }
  readTextFile(_path, _baseDir) {
    throw new Error("Method not implemented.");
  }
  readBinaryFile(_path, _baseDir) {
    throw new Error("Method not implemented.");
  }
  writeTextFile(_path, _data, _baseDir) {
    throw new Error("Method not implemented.");
  }
};

// ../core/dist/utils/serialization.js
var yaml3 = __toESM(require("yaml"));
var import_safe_stable_stringify = __toESM(require("safe-stable-stringify"));
function serializeProject(project) {
  return projectV3Serializer(project);
}
function deserializeProject(serializedProject) {
  try {
    return projectV3Deserializer(serializedProject);
  } catch (err) {
    try {
      return projectV2Deserializer(serializedProject);
    } catch (err2) {
      try {
        return projectV1Deserializer(serializedProject);
      } catch (err3) {
        throw new Error("Could not deserialize project");
      }
    }
  }
}
function serializeGraph(graph) {
  return graphV3Serializer(graph);
}
function deserializeGraph(serializedGraph) {
  try {
    return graphV3Deserializer(serializedGraph);
  } catch (err) {
    try {
      return graphV2Deserializer(serializedGraph);
    } catch (err2) {
      try {
        return graphV1Deserializer(serializedGraph);
      } catch (err3) {
        throw new Error("Could not deserialize graph");
      }
    }
  }
}
function projectV3Serializer(project) {
  const stabilized = JSON.parse((0, import_safe_stable_stringify.default)(toSerializedProject(project)));
  const serialized = yaml3.stringify({
    version: 3,
    data: stabilized
  }, null, {
    indent: 2
  });
  return serialized;
}
function projectV3Deserializer(data) {
  if (typeof data !== "string") {
    throw new Error("Project v3 deserializer requires a string");
  }
  const serializedProject = yaml3.parse(data);
  if (serializedProject.version !== 3) {
    throw new Error("Project v3 deserializer requires a version 3 project");
  }
  const project = fromSerializedProject(serializedProject.data);
  doubleCheckProject(project);
  return project;
}
function projectV2Deserializer(data) {
  if (typeof data !== "string") {
    throw new Error("Project v2 deserializer requires a string");
  }
  const project = yaml3.parse(data);
  if (project.version !== 2) {
    throw new Error("Project v2 deserializer requires a version 2 project");
  }
  doubleCheckProject(project.data);
  return project.data;
}
function projectV1Deserializer(data) {
  if (typeof data !== "string") {
    throw new Error("Project v1 deserializer requires a string");
  }
  const project = JSON.parse(data);
  doubleCheckProject(project);
  return project;
}
function graphV3Serializer(graph) {
  const stabilized = JSON.parse((0, import_safe_stable_stringify.default)(toSerializedGraph(graph)));
  const serialized = yaml3.stringify({
    version: 3,
    data: stabilized
  }, null, {
    indent: 2
  });
  return serialized;
}
function graphV3Deserializer(data) {
  if (typeof data !== "string") {
    throw new Error("Graph v3 deserializer requires a string");
  }
  const serializedGraph = yaml3.parse(data);
  if (serializedGraph.version !== 3) {
    throw new Error("Graph v3 deserializer requires a version 3 graph");
  }
  return fromSerializedGraph(serializedGraph.data);
}
function graphV2Deserializer(data) {
  if (typeof data !== "string") {
    throw new Error("Graph v2 deserializer requires a string");
  }
  const graph = yaml3.parse(data);
  if (graph.version !== 2) {
    throw new Error("Graph v2 deserializer requires a version 2 graph");
  }
  return graph.data;
}
function graphV1Deserializer(data) {
  if (typeof data !== "string") {
    throw new Error("Graph v1 deserializer requires a string");
  }
  const graph = JSON.parse(data);
  if (!graph.nodes || !graph.connections) {
    throw new Error("Invalid graph file");
  }
  return graph;
}
function doubleCheckProject(project) {
  if (!project.metadata || !project.metadata.id || !project.metadata.title || !project.graphs || typeof project.graphs !== "object") {
    throw new Error("Invalid project file");
  }
}
function toSerializedProject(project) {
  return {
    metadata: project.metadata,
    graphs: mapValues_default(project.graphs, (graph) => toSerializedGraph(graph))
  };
}
function fromSerializedProject(serializedProject) {
  return {
    metadata: serializedProject.metadata,
    graphs: mapValues_default(serializedProject.graphs, (graph) => fromSerializedGraph(graph))
  };
}
function toSerializedGraph(graph) {
  return {
    metadata: {
      id: graph.metadata.id,
      name: graph.metadata.name,
      description: graph.metadata.description
    },
    nodes: graph.nodes.reduce((acc, node) => ({
      ...acc,
      [node.id]: toSerializedNode(node, graph.nodes, graph.connections)
    }), {})
  };
}
function fromSerializedGraph(serializedGraph) {
  const allConnections = [];
  const allNodes = [];
  for (const node of Object.values(serializedGraph.nodes)) {
    const [chartNode, connections] = fromSerializedNode(node);
    allNodes.push(chartNode);
    allConnections.push(...connections);
  }
  return {
    metadata: {
      id: serializedGraph.metadata.id,
      name: serializedGraph.metadata.name,
      description: serializedGraph.metadata.description
    },
    nodes: allNodes,
    connections: allConnections
  };
}
function toSerializedNode(node, allNodes, allConnections) {
  return {
    id: node.id,
    title: node.title,
    description: node.description,
    type: node.type,
    visualData: `${node.visualData.x}/${node.visualData.y}/${node.visualData.width ?? "null"}/${node.visualData.zIndex ?? "null"}`,
    isSplitRun: node.isSplitRun,
    splitRunMax: node.splitRunMax,
    data: node.data,
    outgoingConnections: allConnections.filter((connection) => connection.outputNodeId === node.id).map((connection) => toSerializedConnection(connection, allNodes)).sort()
  };
}
function fromSerializedNode(serializedNode) {
  const [x, y, width, zIndex] = serializedNode.visualData.split("/");
  const connections = serializedNode.outgoingConnections.map((serializedConnection) => fromSerializedConnection(serializedConnection, serializedNode));
  return [
    {
      id: serializedNode.id,
      title: serializedNode.title,
      description: serializedNode.description,
      type: serializedNode.type,
      isSplitRun: serializedNode.isSplitRun,
      splitRunMax: serializedNode.splitRunMax,
      visualData: {
        x: parseFloat(x),
        y: parseFloat(y),
        width: width === "null" ? void 0 : parseFloat(width),
        zIndex: zIndex === "null" ? void 0 : parseFloat(zIndex)
      },
      data: serializedNode.data
    },
    connections
  ];
}
function toSerializedConnection(connection, allNodes) {
  var _a;
  return `${connection.outputId}->"${(_a = allNodes.find((node) => node.id === connection.inputNodeId)) == null ? void 0 : _a.title}" ${connection.inputNodeId}/${connection.inputId}`;
}
function fromSerializedConnection(connection, outgoingNode) {
  const [, outputId, , inputNodeId, inputId] = connection.match(/(.+)->"(.+)" (.+)\/(.+)/);
  return {
    outputId,
    outputNodeId: outgoingNode.id,
    inputId,
    inputNodeId
  };
}

// src/api.ts
var import_promises2 = require("node:fs/promises");
async function loadProjectFromFile(path) {
  const content = await (0, import_promises2.readFile)(path, { encoding: "utf8" });
  return loadProjectFromString(content);
}
function loadProjectFromString(content) {
  return deserializeProject(content);
}
async function runGraphInFile(path, options) {
  const project = await loadProjectFromFile(path);
  return runGraph(project, options);
}
function createProcessor(project, options) {
  var _a, _b, _c;
  const { graph, inputs = {}, context = {} } = options;
  const graphId = graph in project.graphs ? graph : (_b = (_a = Object.values(project.graphs).find((g) => {
    var _a2;
    return ((_a2 = g.metadata) == null ? void 0 : _a2.name) === graph;
  })) == null ? void 0 : _a.metadata) == null ? void 0 : _b.id;
  if (!graphId) {
    throw new Error("Graph not found");
  }
  const processor = new GraphProcessor(project, graphId);
  if (options.remoteDebugger) {
    options.remoteDebugger.attach(processor);
  }
  if (options.onStart) {
    processor.on("start", options.onStart);
  }
  if (options.onNodeStart) {
    processor.on("nodeStart", options.onNodeStart);
  }
  if (options.onNodeFinish) {
    processor.on("nodeFinish", options.onNodeFinish);
  }
  if (options.onNodeError) {
    processor.on("nodeError", options.onNodeError);
  }
  if (options.onNodeExcluded) {
    processor.on("nodeExcluded", options.onNodeExcluded);
  }
  if (options.onPartialOutput) {
    processor.on("partialOutput", options.onPartialOutput);
  }
  if (options.onUserInput) {
    processor.on("userInput", options.onUserInput);
  }
  if (options.onDone) {
    processor.on("done", options.onDone);
  }
  if (options.onAbort) {
    processor.on("abort", options.onAbort);
  }
  if (options.onTrace) {
    processor.on("trace", options.onTrace);
  }
  if (options.onNodeOutputsCleared) {
    processor.on("nodeOutputsCleared", options.onNodeOutputsCleared);
  }
  if (options.externalFunctions) {
    for (const [name, fn] of Object.entries(options.externalFunctions)) {
      processor.setExternalFunction(name, fn);
    }
  }
  if (options.onUserEvent) {
    for (const [name, fn] of Object.entries(options.onUserEvent)) {
      processor.onUserEvent(name, fn);
    }
  }
  (_c = options.abortSignal) == null ? void 0 : _c.addEventListener("abort", () => {
    processor.abort();
  });
  const resolvedInputs = mapValues_default(inputs, (value) => {
    if (typeof value === "string") {
      return { type: "string", value };
    }
    if (typeof value === "number") {
      return { type: "number", value };
    }
    if (typeof value === "boolean") {
      return { type: "boolean", value };
    }
    return value;
  });
  const resolvedContextValues = mapValues_default(context, (value) => {
    if (typeof value === "string") {
      return { type: "string", value };
    }
    if (typeof value === "number") {
      return { type: "number", value };
    }
    if (typeof value === "boolean") {
      return { type: "boolean", value };
    }
    return value;
  });
  return {
    processor,
    inputs: resolvedInputs,
    contextValues: resolvedContextValues,
    async run() {
      const outputs = await processor.processGraph(
        {
          nativeApi: options.nativeApi ?? new NodeNativeApi(),
          settings: {
            openAiKey: options.openAiKey,
            openAiOrganization: options.openAiOrganization
          }
        },
        resolvedInputs,
        resolvedContextValues
      );
      return outputs;
    }
  };
}
async function runGraph(project, options) {
  const processorInfo = createProcessor(project, options);
  return processorInfo.run();
}

// src/debugger.ts
var import_ws = __toESM(require("ws"));
var import_ts_pattern3 = require("ts-pattern");
function startDebuggerServer(options = {}) {
  const { port = 21888 } = options;
  const server = options.server ?? new import_ws.WebSocketServer({ port });
  const emitter = new Emittery();
  const attachedProcessors = [];
  server.on("connection", (socket) => {
    socket.on("message", async (data) => {
      var _a, _b;
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "run") {
          const { graphId } = message.data;
          await ((_a = options.dynamicGraphRun) == null ? void 0 : _a.call(options, { client: socket, graphId }));
        } else {
          const processors = ((_b = options.getProcessorsForClient) == null ? void 0 : _b.call(options, socket, attachedProcessors)) ?? attachedProcessors;
          for (const processor of processors) {
            await (0, import_ts_pattern3.match)(message).with({ type: "abort" }, async () => {
              await processor.abort();
            }).with({ type: "pause" }, async () => {
              processor.pause();
            }).with({ type: "resume" }, async () => {
              processor.resume();
            }).otherwise(async () => {
              throw new Error(`Unknown message type: ${message.type}`);
            });
          }
        }
      } catch (err) {
        try {
          await emitter.emit("error", getError(err));
        } catch (err2) {
        }
      }
    });
  });
  return {
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    webSocketServer: server,
    /** Given an event on a processor, sends that processor's events to the correct debugger clients (allows routing debugger). */
    broadcast(procesor, message, data) {
      var _a;
      const clients = ((_a = options.getClientsForProcessor) == null ? void 0 : _a.call(options, procesor, [...server.clients])) ?? [...server.clients];
      clients.forEach((client) => {
        if (client.readyState === import_ws.default.OPEN) {
          client.send(JSON.stringify({ message, data }));
        }
      });
    },
    attach(processor) {
      if (attachedProcessors.find((p) => p.id === processor.id)) {
        return;
      }
      attachedProcessors.push(processor);
      processor.on("nodeStart", (data) => {
        this.broadcast(processor, "nodeStart", data);
      });
      processor.on("nodeFinish", (data) => {
        this.broadcast(processor, "nodeFinish", data);
      });
      processor.on("nodeError", ({ node, error, processId }) => {
        this.broadcast(processor, "nodeError", {
          node,
          error: typeof error === "string" ? error : error.toString(),
          processId
        });
      });
      processor.on("error", ({ error }) => {
        this.broadcast(processor, "error", {
          error: typeof error === "string" ? error : error.toString()
        });
      });
      processor.on("graphError", ({ graph, error }) => {
        this.broadcast(processor, "graphError", {
          graph,
          error: typeof error === "string" ? error : error.toString()
        });
      });
      processor.on("nodeExcluded", (data) => {
        this.broadcast(processor, "nodeExcluded", data);
      });
      processor.on("start", () => {
        this.broadcast(processor, "start", null);
      });
      processor.on("done", (data) => {
        this.broadcast(processor, "done", data);
      });
      processor.on("partialOutput", (data) => {
        this.broadcast(processor, "partialOutput", data);
      });
      processor.on("abort", () => {
        this.broadcast(processor, "abort", null);
      });
      processor.on("trace", (message) => {
        this.broadcast(processor, "trace", message);
      });
      processor.on("nodeOutputsCleared", (data) => {
        this.broadcast(processor, "nodeOutputsCleared", data);
      });
      processor.on("graphStart", (data) => {
        this.broadcast(processor, "graphStart", data);
      });
      processor.on("graphFinish", (data) => {
        this.broadcast(processor, "graphFinish", data);
      });
      processor.on("pause", () => {
        this.broadcast(processor, "pause", null);
      });
      processor.on("resume", () => {
        this.broadcast(processor, "resume", null);
      });
    },
    detach(processor) {
      const processorIndex = attachedProcessors.findIndex((p) => p.id === processor.id);
      if (processorIndex !== -1) {
        attachedProcessors.splice(processorIndex, 1);
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ArrayNodeImpl,
  AssemblePromptNodeImpl,
  BrowserNativeApi,
  ChatNodeImpl,
  ChunkNodeImpl,
  CoalesceNodeImpl,
  CodeNodeImpl,
  ContextNodeImpl,
  ExternalCallNodeImpl,
  ExtractJsonNodeImpl,
  ExtractObjectPathNodeImpl,
  ExtractRegexNodeImpl,
  ExtractYamlNodeImpl,
  GetGlobalNodeImpl,
  GraphInputNodeImpl,
  GraphOutputNodeImpl,
  GraphProcessor,
  IfElseNodeImpl,
  IfNodeImpl,
  LoopControllerNodeImpl,
  MatchNodeImpl,
  NodeImpl,
  NodeNativeApi,
  PassthroughNodeImpl,
  PopNodeImpl,
  PromptNodeImpl,
  RaiseEventNodeImpl,
  ReadDirectoryNodeImpl,
  ReadFileNodeImpl,
  SetGlobalNodeImpl,
  SubGraphNodeImpl,
  TextNodeImpl,
  ToYamlNodeImpl,
  ToolNodeImpl,
  TrimChatMessagesNodeImpl,
  UserInputNodeImpl,
  WaitForEventNodeImpl,
  addWarning,
  arrayNode,
  arrayTypeToScalarType,
  arrayizeDataValue,
  assemblePromptNode,
  assertBaseDir,
  baseDirs,
  chatNode,
  chunkNode,
  coalesceNode,
  codeNode,
  coerceType,
  coerceTypeOptional,
  contextNode,
  createNodeInstance,
  createProcessor,
  createUnknownNodeInstance,
  dataTypeDisplayNames,
  dataTypes,
  deserializeGraph,
  deserializeProject,
  emptyNodeGraph,
  expectType,
  expectTypeOptional,
  externalCallNode,
  extractJsonNode,
  extractObjectPathNode,
  extractRegexNode,
  extractYamlNode,
  functionTypeToScalarType,
  getDefaultValue,
  getError,
  getGlobalNode,
  getNodeDisplayName,
  getScalarTypeOf,
  getWarnings,
  graphInputNode,
  graphOutputNode,
  ifElseNode,
  ifNode,
  inferType,
  isArrayDataType,
  isArrayDataValue,
  isFunctionDataType,
  isFunctionDataValue,
  isNotFunctionDataValue,
  isScalarDataType,
  isScalarDataValue,
  loadProjectFromFile,
  loadProjectFromString,
  loopControllerNode,
  matchNode,
  nodeDefinition,
  nodeFactory,
  passthroughNode,
  popNode,
  promptNode,
  raiseEventNode,
  readDirectoryNode,
  readFileNode,
  runGraph,
  runGraphInFile,
  scalarDefaults,
  scalarTypes,
  serializeGraph,
  serializeProject,
  setGlobalNode,
  startDebuggerServer,
  subGraphNode,
  textNode,
  toYamlNode,
  toolNode,
  trimChatMessagesNode,
  unwrapDataValue,
  userInputNode,
  waitForEventNode
});
/*! Bundled license information:

lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)
*/
