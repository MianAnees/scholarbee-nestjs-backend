/**  
* TypeScript utility to omit properties from an interface
* @usage:
* ```ts
* interface User {
*  id: string;
*  name: string;
*  email: string;
*  password: string;
* }
* type PublicUser = BetterOmit<User, 'password'>;
* // PublicUser === { id: string; name: string; email: string }
* ```
*/
export type BetterOmit<T, K extends keyof T> = {
    [P in keyof T as P extends K ? never : P]: T[P];
};
  