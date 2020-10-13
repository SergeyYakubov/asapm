/// Just a simple, more precise, definition of object.
// Use this if you want to make a key value map with a string as an key.
// Example 'KvObj' == A map with string key and any-type values
// Example 'KvObj<number>' == A map with string key and number values

// Use this instead of 'object'.
// The `object` type is currently hard to use ([see this issue](https://github.com/microsoft/TypeScript/issues/21732)).
declare type KvObj<ValueType = any> = Record<string, ValueType>;
