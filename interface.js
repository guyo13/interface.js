// Copyright (c) 2020, Guy Or Please see the AUTHORS file for details.
// All rights reserved. Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

function JavascriptInterface(interfaces=[]) {

  if ( !(interfaces instanceof Array) && !(interfaces instanceof Set)) {
    throw `InvalidArgumentException - expected a Set or an Array, got '${interfaces.toString()}'`;
  }

  const interfaceSet = new Set(interfaces);
  // Add the "__isobjectinstance__" builtin interface
  interfaceSet.add("__isobjectinstance__");

  /// A map where keys are function types ("classes") and values are Objects containing
  /// the different interfaces implementations which are registered at Runtime by users' Javascript code
  /// using [JavascriptInterface.prototype.setImplementation()]
  Object.defineProperty(this, "classMap", {
    value: new Map(),
    writable: false,
    enumerable: true,
    configurable: false,
  });

  /// Defines a set of supported interfaces
  Object.defineProperty(this, "interfaces", {
    value: interfaceSet,
    writable: false,
    enumerable: true,
    configurable: false,
  });
};

Object.defineProperty(JavascriptInterface.prototype, "typeFunction", {
  value: "function",
  writable: false,
  enumerable: false,
  configurable: false,
});

Object.defineProperty(JavascriptInterface.prototype, "typeObject", {
  value: "object",
  writable: false,
  enumerable: false,
  configurable: false,
});

/// Define a set of primitive types except of:
/// "function" (which are function classes and dealt with using [classMap])
/// "object" (which is either an Object or null)
Object.defineProperty(JavascriptInterface.prototype, "dataTypes", {
  value: new Set(["undefined", "boolean", "number", "bigint", "string", "symbol"]),
  writable: false,
  enumerable: false,
  configurable: false,
});

/// Returns an implementation of an interface for the JavaScript class of object [instance]
/// if [instance] is a dataType or null, returns [dataTypeImplementation]
/// if no interface implementation is registered for the class returns [defaultImplementation]
/// [instance] - An instance of, or a JavaScript "class" (type "function" or type "object",
/// if the latter then the class is derived by means of the "constructor" property)
/// [interfaceName] - A String matching the interface name to get
/// [defaultImplementation] - An implementation to return if no matching implementation found
/// [dataTypeImplementation] - An implementation to return if [instance] is a "dataType" or null
JavascriptInterface.prototype.getImplementation = function(instance, interfaceName, defaultImplementation, dataTypeImplementation) {
  const instanceType = typeof instance;
  let implementation = defaultImplementation;
  if ( JavascriptInterface.prototype.dataTypes.has(instanceType) || (instance === null) ) {
    return dataTypeImplementation;
  } else {
    let key;
    switch (instanceType) {
      case JavascriptInterface.prototype.typeFunction:
      key = instance;
      break;
      case JavascriptInterface.prototype.typeObject:
      // Get the "class" of the instance object which is the constructor
      key = instance.constructor;
      break;
    }
    if (key) {
      // And get the implementation using the "class" as a key
      const _implementation = this.classMap.has(key) ? this.classMap.get(key)[interfaceName] : undefined;
      // Return the retrieved implementation if it is valid
      if ((typeof _implementation) == JavascriptInterface.prototype.typeFunction) {
        implementation = _implementation;
      }
    }
  }
  return implementation;
};

/// Sets an implementation of an interface for the JavaScript "class" [cls]
/// [cls] - The JavaScript "class" (function type)
/// [interfaceName] - A String matching the interface name to implement
/// [func] - A function that implements the interface
JavascriptInterface.prototype.setImplementation = function(cls, interfaceName, func) {
  const clsType = typeof cls;
  const funcType = typeof func;
  // TODO: support Object type as well
  if (clsType == JavascriptInterface.prototype.typeFunction &&
      funcType == JavascriptInterface.prototype.typeFunction &&
      this.interfaces.has(interfaceName)) {

    // classMap entries are Objects with properties mapping to interface implementations
    const innerObj = this.classMap.get(cls);
    if ( !(innerObj instanceof Object) ) {
      this.classMap.set(cls, {[interfaceName]: func});
    } else {
      innerObj[interfaceName] = func;
    }
  } else {
    throw "InvalidArgumentException";
  }
};

/// Sets an implementation of the "__isobjectinstance__" interface, a function that takes
/// a plain JavaScript object and returns a Boolean indicating whether that object is
/// a valid representation of [cls]. Useful in serialization -> deserialization
/// [cls] - The JavaScript "class" (function type)
/// [func] - A function that implements the "__isobjectinstance__" interface
JavascriptInterface.prototype.setIsObjectInstance = function(cls, func) {
  this.setImplementation(cls, "__isobjectinstance__", func);
};

/// Returns a Boolean indicating whether that object is a valid representation of [cls].
/// [cls] - The JavaScript "class" (function type)
/// [object] - Either a plain JavaScript object or an object created with a function constructor (`new Func();`)
JavascriptInterface.prototype.isObjectInstance = function(object, cls) {
  // If [object] is an instance of [cls] return immediately
  if ( (object instanceof cls) ) {
    return true;
  }
  // Else try to get an implementation and check it
  const impl = this.getImplementation(cls, "__isobjectinstance__");
  if (impl != undefined) {
    if (typeof impl != JavascriptInterface.prototype.typeFunction) {
      throw `InvalidStateException - __isobjectinstance__ implementation is not a function.`;
    }
    return impl(object);
  }
  // Finally if no implementation found return false
  return false;
};


/// Returns the class of an object based on evaluating the implementations of the "__isobjectinstance__" interface.
/// [object] - Either a plain JavaScript object or an object created with a function constructor (`new Func();`)
JavascriptInterface.prototype.classOfObject = function(object) {
  const objectType = typeof object;
  if ( JavascriptInterface.prototype.dataTypes.has(objectType) || (object === null) ) {
    return objectType;
  }
  for (const [cls, impls] of this.classMap) {
    if (this.isObjectInstance(object, cls)) {
      return cls;
    }
  }
  // If no class found, return the type
  return objectType;
};

if (typeof module !== 'undefined') {
    module.exports = JavascriptInterface;
}
