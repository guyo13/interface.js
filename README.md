# interface.js
Runtime Interfaces for JavaScript

## Motivation
The Javascript language currently lacks any type of reliable inheritance or interface mechanism, even the `class` keyword is
just a syntax sugar over a regular [constructor function](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_JS).

interface.js provides a lightweight and extensible API to create interface objects that have a defined set of methods (aka "interfaces"), to which code can register implementations specific to each class that conforms to that interface.

## Examples
With interface.js the JavaScript equivalent of
```java
interface Person {
  void talk();
  void walk();
  String getFullName();
}
```
is possible:

```javascript
/// Create a JavascriptInterface called [Person]
const Person = new JavascriptInterface(["talk", "walk", "getFullName"]);

/// Create helper methods on [Person] which return implementations for "talk", "walk" and "getFullName"
/// based on the class/type of the object passed as an argument.
/// Supply default implementations for classes that are not registered or objects that are Primitives.

Person.getTalkImpl = function(somePerson) {
  return this.getImplementation(
    somePerson,
    "talk",
    // The "default" implementation, returned if [somePerson.constructor] was not registered
    function(obj) { console.log(`${obj.toString()} is talking!`); },
    // The "dataType" implementation, returned if [somePerson] is a JavaScript Data Type of either ("undefined", "boolean", "number", "bigint", "string", "symbol") type
    function(obj) { console.log(`${obj} is talking!`); },
  );
};

Person.getWalkImpl = function(somePerson) {
  return this.getImplementation(
    somePerson,
    "walk",
    function(obj) { console.log(`${obj.toString()} is walking!`); },
    function(obj) { console.log(`${obj} is walking!`); },
  );
};

Person.getFullNameImpl = function(somePerson) {
  return this.getImplementation(
    somePerson,
    "getFullName",
    function(obj) { return ""; },
    function(obj) { return obj; },
  );
};

/// Create some classes that conform to [Person]

function GoodPerson(firstName, lastName) {
  this.firstName = firstName;
  this.lastName = lastName;
}
Person.setImplementation(GoodPerson, "talk", function(goodPerson) {
  console.log(`A Good person named ${goodPerson.firstName} ${goodPerson.lastName} is talking!`);
});
Person.setImplementation(GoodPerson, "walk", function(goodPerson) {
  console.log(`${goodPerson.firstName} ${goodPerson.lastName} is striding purposefully!`);
});
Person.setImplementation(GoodPerson, "getFullName", function(goodPerson) {
  return `${goodPerson.firstName} ${goodPerson.lastName}`;
});

function BadPerson(nickname) {
  this.nickname = nickname;
}
Person.setImplementation(BadPerson, "talk", function(badPerson) {
  console.log(`${badPerson.nickname} is in the house!`);
});
Person.setImplementation(BadPerson, "walk", function(badPerson) {
  console.log(`${badPerson.nickname} is coming to get you!`);
});
Person.setImplementation(BadPerson, "getFullName", function(badPerson) {
  return `${badPerson.nickname}`;
});

function UglyPerson(name) {
  this.name = name;
}
Person.setImplementation(UglyPerson, "talk", function(uglyPerson) {
  console.log(`Thus spoke ${uglyPerson.name}! But did someone listen?`);
});
Person.setImplementation(UglyPerson, "walk", function(uglyPerson) {
  console.log(`${uglyPerson.name} walks alone...`);
});
Person.setImplementation(UglyPerson, "getFullName", function(uglyPerson) {
  return `${uglyPerson.name}`;
});

/// Use the [Person] interface to operate on an Array of different people
const people = [new GoodPerson("Geralt", "of Rivia"), new BadPerson("Lucifer"), new UglyPerson("Zarathustra"), "The Great Merlin"];

for (const person of people) {
  console.log(`Full Name: ${Person.getFullNameImpl(person)(person)}`);
  Person.getWalkImpl(person)(person);
  Person.getTalkImpl(person)(person);
}
/// Output:
// Full Name: Geralt of Rivia
// Geralt of Rivia is striding purposefully!
// A Good person named Geralt of Rivia is talking!
//
// Full Name: Lucifer
// Lucifer is coming to get you!
// Lucifer is in the house!
//
// Full Name: Zarathustra
// Zarathustra walks alone...
// Thus spoke Zarathustra! But did someone listen?
//
// Full Name: The Great Merlin
// The Great Merlin is walking!
// The Great Merlin is talking!
```
