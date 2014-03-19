## Coding Standards

### Rules for declaring types in JavaScript code

1. For the types ```string```, ```number```, ```boolean``` and ```function```, the ```!``` shall be written explicitly.

   __Example__: ```/**@type {!Array.<!function(!string):!boolean>}*/``` to type an object as array of functions which require a ```string``` value, not ```null``` or ```undefined``` as argument and always return a ```boolean``` value, never ```null``` or ```undefined```

   __Rationale__: While for ```string```, ```number``` and ```boolean``` types it is rather weird to have the ```null``` value, it is still better to write the default explicitely, to prevent errors like seen in Closure Compiler's own externs declarations and for consistenty with the rules 2) to 4).

  (Agreed on in ["coding rules for types" ml thread])

2. For the types ```Object```, ```Array``` and ```Function```, the ```?``` shall be written explicitly.

   __Example__: ```/**@return {?Node}*/``` to define that a method returns either an object of type ```Node``` or value ```null```

   __Rationale__: Null pointers can be a problem. The compiler checks the nullness when passing an object but not when accessing a member. Keeping awareness of nullness high is good.

  (Agreed on in ["coding rules for types" ml thread])

3. Objects will always explicitly have ```string``` as the key. So each Object in a type definition starts with ```Object.<!string,```.

  __Rationale__: Any other type makes no sense, because in JavaScript the key type is always a ```string``` anyway.

  (Agreed on in ["coding rules for types" ml thread])

4. Each non-constructor function must have a ```@return``` declaration.

  __Example__: ```/**@return {undefined}*/``` to define that a method returns always ```undefined```, which is also the default

  __Rationale__: Being explicit about what a function returns avoids any ambiguity about whether the ```@return``` declaration was just forgotten or what the exact default is

  (Agreed on in ["coding rules for types" ml thread])


["coding rules for types" ml thread]:https://open.nlnet.nl/pipermail/webodf/2014-February/000117.html
