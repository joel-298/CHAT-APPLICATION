// // ====== 1. Using filter(), some(), and includes() on a simple array ====== //

// const numbers = [3, 5, 7, 8, 10, 12, 15];

// // (A) Filter: Get all even numbers
// const evenNumbers = numbers.filter(num => num % 2 === 0);
// console.log("Even Numbers:", evenNumbers); // Output: [8, 10, 12]

// // (B) Some: Check if there is at least one even number (stops once it finds one)
// const hasEven = numbers.some(num => {
//     console.log(`Checking: ${num}`); // Logs the numbers being checked
//     return num % 2 === 0;
// });
// console.log("Has at least one even number?", hasEven); // Output: true

// // (C) Includes: Check if the number 10 exists in the array
// const hasTen = numbers.includes(10);
// console.log("Does the array include 10?", hasTen); // Output: true


// // ====== 2. Using filter(), some(), and includes() on an array of objects ====== //

// const users = [
//     { id: 1, name: "Alice", age: 25, roles: ["admin", "editor"] },
//     { id: 2, name: "Bob", age: 30, roles: ["user"] },
//     { id: 3, name: "Charlie", age: 22, roles: ["editor", "viewer"] },
//     { id: 4, name: "David", age: 35, roles: ["user", "admin"] }
// ];

// // (A) Filter: Get all users older than 25
// const usersAbove25 = users.filter(user => user.age > 25);
// console.log("Users above 25:", usersAbove25);
// /* Output:
// [
//     { id: 2, name: "Bob", age: 30, roles: ["user"] },
//     { id: 4, name: "David", age: 35, roles: ["user", "admin"] }
// ]
// */

// // (B) Some: Check if any user has the role "admin" (stops after first match)
// const hasAdmin = users.some(user => {
//     console.log(`Checking: ${user.name}`); // Logs the users being checked
//     return user.roles.includes("admin");
// });
// console.log("Is there at least one admin?", hasAdmin); // Output: true

// // (C) Includes: Check if "editor" role is present in any user's roles (using some + includes)
// const hasEditorRole = users.some(user => user.roles.includes("editor"));
// console.log("Is there at least one editor?", hasEditorRole); // Output: true




// // OUTPUT : 
// Even Numbers: [ 8, 10, 12 ]
// Checking: 3
// Checking: 5
// Checking: 7
// Checking: 8
// Has at least one even number? true
// Does the array include 10? true
// Users above 25: [
//   { id: 2, name: 'Bob', age: 30, roles: [ 'user' ] },
//   { id: 4, name: 'David', age: 35, roles: [ 'user', 'admin' ] }
// ]
// Checking: Alice
// Is there at least one admin? true
// Is there at least one editor? true

// === Code Execution Successful ===